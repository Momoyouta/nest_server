import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Like, Repository } from 'typeorm';
import { School } from '@/database/entities/school.entity';
import { CreateSchoolDto } from './dto/CreateSchoolDto.dto';
import { UpdateSchoolDto } from './dto/UpdateSchoolDto.dto';
import { QuerySchoolDto } from './dto/QuerySchoolDto.dto';
import { SchoolStatusMap } from '@/common/utils/school.map';
import { SchoolApplication } from '@/database/entities/school_application.entity';
import { ApplySchoolDto } from './dto/ApplySchoolDto.dto';
import { QuerySchoolApplicationDto } from './dto/QuerySchoolApplicationDto.dto';
import { ReviewSchoolApplicationDto } from './dto/ReviewSchoolApplicationDto.dto';
import {
  SchoolApplicationReviewActionMap,
  SchoolApplicationStatusMap,
} from '@/common/utils/school-application.map';
import { User } from '@/database/entities/user.entity';
import { SchoolAdmin } from '@/database/entities/school_admin.entity';
import { AdminRolesMap } from '@/common/utils/role.map';
import * as bcrypt from 'bcrypt';
import { AsyncLocalstorageService } from '@/modules/async/async/asyncLocalstorage.service';
import { StorageService } from '@/modules/file/storage/storage.service';

@Injectable()
export class SchoolService {
  private readonly logger = new Logger(SchoolService.name);

  constructor(
    @InjectRepository(School)
    private schoolRepository: Repository<School>,
    @InjectRepository(SchoolApplication)
    private schoolApplicationRepository: Repository<SchoolApplication>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(SchoolAdmin)
    private schoolAdminRepository: Repository<SchoolAdmin>,
    private readonly dataSource: DataSource,
    private readonly alsService: AsyncLocalstorageService,
    private readonly storageService: StorageService,
  ) {}

  async applySchool(applySchoolDto: ApplySchoolDto): Promise<SchoolApplication> {
    const schoolApplication = this.schoolApplicationRepository.create({
      school_name: applySchoolDto.school_name,
      school_address: applySchoolDto.school_address,
      charge_name: applySchoolDto.charge_name,
      charge_phone: applySchoolDto.charge_phone,
      evidence_img_url: applySchoolDto.evidence_img_url,
      status: SchoolApplicationStatusMap.PENDING,
    });

    return await this.schoolApplicationRepository.save(schoolApplication);
  }

  async findAllApplications(
    query: QuerySchoolApplicationDto,
  ): Promise<{ list: SchoolApplication[]; total: number }> {
    const { page = 1, pageSize = 10, status, school_name, charge_phone } = query;

    const where: any = {};
    if (status !== undefined) where.status = status;
    if (school_name) where.school_name = Like(`%${school_name}%`);
    if (charge_phone) where.charge_phone = Like(`%${charge_phone}%`);

    const [list, total] = await this.schoolApplicationRepository.findAndCount({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      order: { created_at: 'DESC' },
    });

    return { list, total };
  }

  async reviewApplication(
    id: string,
    reviewDto: ReviewSchoolApplicationDto,
  ): Promise<SchoolApplication> {
    const currentUserId = this.alsService.getUserId();
    const reviewedBy = currentUserId && /^\d+$/.test(currentUserId)
      ? Number(currentUserId)
      : null;

    if (currentUserId && reviewedBy === null) {
      this.logger.warn(
        `reviewed_by 字段为 int，当前管理员ID(${currentUserId})无法落库，将写入 null`,
      );
    }

    return await this.dataSource.transaction(async (manager) => {
      const appRepo = manager.getRepository(SchoolApplication);
      const schoolRepo = manager.getRepository(School);
      const userRepo = manager.getRepository(User);
      const schoolAdminRepo = manager.getRepository(SchoolAdmin);

      const application = await appRepo.findOne({ where: { id } });
      if (!application) {
        throw new NotFoundException('申请记录不存在');
      }

      if (application.status !== SchoolApplicationStatusMap.PENDING) {
        throw new BadRequestException('该申请已处理，请勿重复审批');
      }

      if (reviewDto.action === SchoolApplicationReviewActionMap.APPROVE) {
        const school = schoolRepo.create({
          name: application.school_name,
          address: application.school_address,
          charge_name: application.charge_name,
          charge_phone: application.charge_phone,
          evidence_img_url: application.evidence_img_url,
          status: SchoolStatusMap.ENABLED,
        });
        const savedSchool = await schoolRepo.save(school);

        // 1. 根据 storage 模块创建 {school_id} 的文件夹及其子文件夹
        const schoolId = (savedSchool as any).id;
        this.storageService.createSchoolDir({ schoolId });

        // 2. 把证明图片迁移至 fileStore/schools/{school_id}/private/evidence_img.png
        if (application.evidence_img_url) {
          // 假设 evidence_img_url 为相对路径，如 /uploads/temp/images/xxx.png
          const destRelative = `/schools/${schoolId}/private/evidence_img.png`;
          try {
            this.storageService.moveFile(application.evidence_img_url, destRelative);
            // 3. 修正 evidence_img_url 的值为新相对地址
            savedSchool.evidence_img_url = destRelative;
            await schoolRepo.save(savedSchool);
            application.evidence_img_url = destRelative;
          } catch (error) {
            this.logger.error(`Failed to move evidence image: ${error.message}`);
            // 迁移失败不中断整个审批流程，但记录日志
          }
        }

        const account = await this.generateUniqueAccount(
          application.charge_phone,
          userRepo,
        );
        const plainPassword = this.generateRandomPassword(8);
        const hashedPassword = await bcrypt.hash(
          plainPassword,
          await bcrypt.genSalt(10),
        );

        const user = userRepo.create({
          name: application.charge_name,
          role_id: AdminRolesMap.school_root,
          account,
          password: hashedPassword,
          phone: application.charge_phone,
          status: 1,
        });
        const savedUser = await userRepo.save(user);

        const schoolAdmin = schoolAdminRepo.create({
          school_id: String((savedSchool as any).id),
          user_id: savedUser.id,
        });
        await schoolAdminRepo.save(schoolAdmin);

        application.status = SchoolApplicationStatusMap.APPROVED;
        application.review_remark = reviewDto.review_remark;
        application.reviewed_by = reviewedBy !== null ? String(reviewedBy) : undefined;
        application.reject_reason = undefined;
        const updatedApplication = await appRepo.save(application);

        this.logger.log(
          `[SMS-PENDING] 学校申请通过通知, phone=${application.charge_phone}, school=${application.school_name}, account=${account}, password=${plainPassword}`,
        );

        return updatedApplication;
      }

      if (reviewDto.action === SchoolApplicationReviewActionMap.REJECT) {
        application.status = SchoolApplicationStatusMap.REJECTED;
        application.review_remark = reviewDto.review_remark || '审核未通过';
        application.reviewed_by = reviewedBy !== null ? String(reviewedBy) : undefined;
        application.reject_reason =
          reviewDto.reject_reason !== undefined
            ? String(reviewDto.reject_reason)
            : undefined;
        const updatedApplication = await appRepo.save(application);

        this.logger.log(
          `[SMS-PENDING] 学校申请驳回通知, phone=${application.charge_phone}, school=${application.school_name}, reason=${application.review_remark}`,
        );

        return updatedApplication;
      }

      throw new BadRequestException('无效审批动作');
    });
  }

  private generateRandomLetters(length: number): string {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  }

  private generateRandomPassword(length: number): string {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  }

  private async generateUniqueAccount(
    phone: string,
    userRepo: Repository<User>,
  ): Promise<string> {
    for (let i = 0; i < 20; i++) {
      const account = `${this.generateRandomLetters(4)}${phone}`;
      const exists = await userRepo.findOne({ where: { account } });
      if (!exists) {
        return account;
      }
    }
    throw new BadRequestException('账号生成失败，请稍后重试');
  }

  async create(createSchoolDto: CreateSchoolDto): Promise<School> {
    const school = this.schoolRepository.create(createSchoolDto);
    return await this.schoolRepository.save(school);
  }

  async findAll(query: QuerySchoolDto): Promise<{ list: School[]; total: number }> {
    const { page = 1, pageSize = 10, id, name, charge_name, charge_phone, status } = query;

    const where: any = {};
    if (id) where.id = id;
    if (name) where.name = Like(`%${name}%`);
    if (charge_name) where.charge_name = Like(`%${charge_name}%`);
    if (charge_phone) where.charge_phone = Like(`%${charge_phone}%`);
    if (status !== undefined) where.status = status;

    const [list, total] = await this.schoolRepository.findAndCount({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      order: { create_time: 'DESC' },
    });

    return { list, total };
  }

  async findOne(id: string): Promise<School> {
    const school = await this.schoolRepository.findOneBy({ id });
    if (!school) {
      throw new NotFoundException('学校不存在');
    }
    return school;
  }

  async update(id: string, updateSchoolDto: UpdateSchoolDto): Promise<School> {
    (updateSchoolDto as any).update_time = String(Math.floor(Date.now() / 1000));
    const result = await this.schoolRepository.update(id, updateSchoolDto);
    if (result.affected === 0) {
      throw new NotFoundException('学校不存在');
    }
    return this.findOne(id);
  }

  /**
   * 软删除：将状态设置为禁用 (2)
   */
  async softDelete(id: string): Promise<{ code: number; message: string }> {
    const result = await this.schoolRepository.update(id, {
      status: SchoolStatusMap.DISABLED,
    });
    if (result.affected === 0) {
      throw new NotFoundException('学校不存在');
    }
    return { code: 200, message: '禁用成功' };
  }

  async remove(id: string): Promise<{ code: number; message: string }> {
    const result = await this.schoolRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('学校不存在');
    }
    return { code: 200, message: '删除成功' };
  }
}
