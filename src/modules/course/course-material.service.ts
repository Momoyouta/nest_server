import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Not, Repository } from 'typeorm';
import { CourseMaterial } from '@/database/entities/course_material.entity';
import { Course } from '@/database/entities/course.entity';
import { FileChunk } from '@/modules/file/chunk/chunk.entity';
import { Teacher } from '@/database/entities/teacher.entity';
import { User } from '@/database/entities/user.entity';
import { Student } from '@/database/entities/student.entity';
import { SchoolAdmin } from '@/database/entities/school_admin.entity';
import { CourseGroupTeacher } from '@/database/entities/course_group_teacher.entity';
import { AsyncLocalstorageService } from '@/modules/async/async/asyncLocalstorage.service';
import { StorageService } from '@/modules/file/storage/storage.service';
import {
  BindMaterialDto,
  ListMaterialQueryDto,
  UpdateMaterialDto,
  DeleteMaterialDto,
  ListMaterialResponseDto,
} from '@/modules/course/dto/course-material.dto';
import { PlatformAdminRoles, SchoolAdminRoles } from '@/common/utils/role.map';
import { FilePathTemplate } from '@/common/utils/file-path.map';

@Injectable()
export class CourseMaterialService {
  constructor(
    @InjectRepository(CourseMaterial)
    private readonly materialRepo: Repository<CourseMaterial>,
    @InjectRepository(Course)
    private readonly courseRepo: Repository<Course>,
    @InjectRepository(FileChunk)
    private readonly fileChunkRepo: Repository<FileChunk>,
    @InjectRepository(Teacher)
    private readonly teacherRepo: Repository<Teacher>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    @InjectRepository(SchoolAdmin)
    private readonly schoolAdminRepo: Repository<SchoolAdmin>,
    @InjectRepository(CourseGroupTeacher)
    private readonly courseGroupTeacherRepo: Repository<CourseGroupTeacher>,
    private readonly alsService: AsyncLocalstorageService,
    private readonly storageService: StorageService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * 校验权限中心化方法
   * @param courseId 课程ID
   * @param mode 模式：'manage' (增删改) 或 'view' (查询)
   */
  private async validatePermission(courseId: string, mode: 'manage' | 'view' = 'manage') {
    const userId = this.alsService.getUserId();
    if (!userId) throw new ForbiddenException('未登录');

    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) throw new NotFoundException('用户不存在');

    const course = await this.courseRepo.findOneBy({ id: courseId });
    if (!course) throw new NotFoundException('课程不存在');

    const roleIds = user.role_id.split(',').map((r) => r.trim());

    // 1. 平台管理员
    const isPlatformAdmin = roleIds.some((r) => PlatformAdminRoles.includes(r));
    if (isPlatformAdmin) return { userId, operatorId: userId, course };

    // 2. 学校管理员
    const isSchoolAdmin = roleIds.some((r) => SchoolAdminRoles.includes(r));
    if (isSchoolAdmin) {
      const admin = await this.schoolAdminRepo.findOneBy({ user_id: userId });
      if (!admin || admin.school_id !== course.school_id) {
        throw new ForbiddenException('无权操作该校课程资料');
      }
      return { userId, operatorId: admin.id, course };
    }

    // 3. 教师
    const isTeacher = roleIds.includes('4'); // 4 为教师
    if (isTeacher) {
      const teacher = await this.teacherRepo.findOneBy({ user_id: userId });
      if (!teacher || teacher.school_id !== course.school_id) {
        throw new ForbiddenException('无权访问该校课程资料');
      }

      if (mode === 'manage') {
        // 管理模式下：必须在教学组中
        const inGroup = await this.courseGroupTeacherRepo
          .createQueryBuilder('gt')
          .innerJoin('course_teaching_group', 'tg', 'tg.id = gt.group_id')
          .where('tg.course_id = :courseId', { courseId })
          .andWhere('gt.teacher_id = :teacherId', { teacherId: teacher.id })
          .getOne();

        if (!inGroup) {
          throw new ForbiddenException('您不在该课程的教学组中，无法管理资料');
        }
      }

      return { userId, operatorId: teacher.id, course };
    }

    // 4. 学生
    const isStudent = roleIds.includes('3'); // 3 为学生
    if (isStudent && mode === 'view') {
      const student = await this.studentRepo.findOne({
        where: { user_id: userId },
      });
      if (!student || student.school_id !== course.school_id) {
        throw new ForbiddenException('无权查看其他学校课程资料');
      }
      return { userId, operatorId: student.id, course };
    }

    throw new ForbiddenException('当前角色无权限操作资料');
  }

  /**
   * 绑定/上传资料
   */
  async bindMaterial(dto: BindMaterialDto) {
    const { userId, course } = await this.validatePermission(dto.course_id);

    const fileChunk = await this.fileChunkRepo.findOneBy({ id: dto.file_id });
    if (!fileChunk) throw new NotFoundException('文件记录不存在');

    // 如果文件还在临时目录，则移动它
    const fileHash = fileChunk.fileHash;
    const ext = fileChunk.fileName.split('.').pop() || '';
    const fullFileName = ext ? `${fileHash}.${ext}` : fileHash;

    const dir1 = fileHash.substring(0, 2);
    const dir2 = fileHash.substring(2, 4);
    
    // 资源库目标路径逻辑
    const destRelativeDir = `schools/${course.school_id}/resource_library/materials/${dir1}/${dir2}`;
    const destRelativePath = `${destRelativeDir}/${fullFileName}`;

    // 检查是否已经在目标位置（多课程复用同一 file_id 场景）
    if (fileChunk.targetPath !== destRelativeDir) {
      // 确定源路径
      let srcRelative: string | null = null;
      if (fileChunk.status === 'done' && fileChunk.targetPath) {
          srcRelative = `${fileChunk.targetPath}/${fullFileName}`;
      } else {
        // 尝试从 temp 找 (1: video, 2: others)
        const tempPrefix = fileChunk.type === 1 ? 'uploads/temp/videos' : 'uploads/temp';
        srcRelative = `${tempPrefix}/${fullFileName}`;
      }

      // 物理移动
      if (srcRelative) {
        this.storageService.moveFile(srcRelative, destRelativePath);
      }
      
      // 更新 FileChunk
      fileChunk.targetPath = destRelativeDir;
      fileChunk.status = 'done';
      await this.fileChunkRepo.save(fileChunk);
    }

    // 创建资料记录
    const material = this.materialRepo.create({
      course_id: dto.course_id,
      file_id: dto.file_id,
      uploader_id: userId,
    });
    const saved = await this.materialRepo.save(material);

    return { id: saved.id, bound: true };
  }

  /**
   * 分页查询资料列表
   */
  async listMaterials(query: ListMaterialQueryDto): Promise<ListMaterialResponseDto> {
    await this.validatePermission(query.course_id, 'view');

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;

    const qb = this.materialRepo
      .createQueryBuilder('cm')
      .innerJoin(FileChunk, 'fc', 'fc.id = cm.file_id')
      .leftJoin(User, 'u', 'u.id = cm.uploader_id') // 注意这里逻辑，如果是教师上传，uploader_id 可能存的是 teacher.id
      // 这里的 uploader_id 可能是 teacher.id, school_admin.id 或 user.id
      // 为了拿到姓名，可能需要根据角色多表 JOIN。简单起见，如果 uploader_id 是 user.id 直接 JOIN User
      // 如果 uploader_id 是业务 ID，需特殊处理。
      // 统一建议：在 DDL 设计中，uploader_id 存储 User.id 最通用。
      .select([
        'cm.id as id',
        'cm.file_id as file_id',
        'fc.file_name as file_name',
        'cm.uploader_id as uploader_id',
        'cm.create_time as create_time',
      ])
      .addSelect('u.name', 'uploader_name') // 假设 uploader_id 指向 User.id
      .where('cm.course_id = :courseId', { courseId: query.course_id });

    if (query.file_name) {
      qb.andWhere('fc.file_name LIKE :name', { name: `%${query.file_name}%` });
    }

    const total = await qb.getCount();
    const list = await qb
      .orderBy('cm.create_time', 'DESC')
      .offset((page - 1) * pageSize)
      .limit(pageSize)
      .getRawMany();

    return {
      list,
      total,
    };
  }

  /**
   * 修改文件名
   */
  async updateMaterialName(dto: UpdateMaterialDto) {
    const material = await this.materialRepo.findOneBy({ id: dto.material_id });
    if (!material) throw new NotFoundException('资料记录不存在');

    await this.validatePermission(material.course_id);

    const fileChunk = await this.fileChunkRepo.findOneBy({ id: material.file_id });
    if (!fileChunk) throw new NotFoundException('文件记录不存在');

    fileChunk.fileName = dto.file_name;
    await this.fileChunkRepo.save(fileChunk);

    return { id: material.id, updated: true };
  }

  /**
   * 删除资料
   */
  async deleteMaterial(dto: DeleteMaterialDto) {
    const material = await this.materialRepo.findOneBy({ id: dto.material_id });
    if (!material) throw new NotFoundException('资料记录不存在');

    const { course } = await this.validatePermission(material.course_id);

    if (dto.mode === 2) {
      // 彻底删除模式
      const otherRef = await this.materialRepo.count({
        where: { file_id: material.file_id, id: Not(material.id) },
      });

      // User feedback: throw error if referenced by other courses
      if (otherRef > 0) {
        throw new BadRequestException('无法彻底删除：该资料已被其他课程引用');
      }

      const fileChunk = await this.fileChunkRepo.findOneBy({ id: material.file_id });
      if (fileChunk && fileChunk.targetPath) {
        const fileHash = fileChunk.fileHash;
        const ext = fileChunk.fileName.split('.').pop() || '';
        const fullFileName = ext ? `${fileHash}.${ext}` : fileHash;
        const relativePath = `${fileChunk.targetPath}/${fullFileName}`;
        
        this.storageService.deleteFile(relativePath);
        // 也删除 file_chunk 记录吗？通常建议物理删除时同步清理元数据
        await this.fileChunkRepo.delete(fileChunk.id);
      }
    }

    // 统一删除绑定记录
    await this.materialRepo.delete(material.id);

    return { id: dto.material_id, deleted: true };
  }
}
