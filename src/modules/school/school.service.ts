import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { School } from '@/database/entities/school.entity';
import { CreateSchoolDto } from './dto/CreateSchoolDto.dto';
import { UpdateSchoolDto } from './dto/UpdateSchoolDto.dto';
import { QuerySchoolDto } from './dto/QuerySchoolDto.dto';
import { SchoolStatusMap } from '@/common/utils/school.map';

@Injectable()
export class SchoolService {
  constructor(
    @InjectRepository(School)
    private schoolRepository: Repository<School>,
  ) { }

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
