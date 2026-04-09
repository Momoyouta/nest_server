import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { College } from '@/database/entities/college.entity';
import { Student } from '@/database/entities/student.entity';
import { BaseQueryDto } from '@/common/dto/base-query.dto';

@Injectable()
export class CollegeService {
  constructor(
    @InjectRepository(College)
    private readonly collegeRepository: Repository<College>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
  ) {}

  async create(data: Partial<College>): Promise<College> {
    const college = this.collegeRepository.create(data);
    return await this.collegeRepository.save(college);
  }

  async findAll(query: BaseQueryDto) {
    const { page = 1, pageSize = 10, schoolId, school_id } = query as any;
    const finalSchoolId = schoolId || school_id;

    const qb = this.collegeRepository.createQueryBuilder('college');
    qb.leftJoinAndSelect('college.school', 'school');

    if (finalSchoolId) {
      qb.andWhere('college.school_id = :schoolId', { schoolId: finalSchoolId });
    }

    qb.orderBy('college.id', 'DESC');
    qb.skip((page - 1) * pageSize).take(pageSize);

    const [items, total] = await qb.getManyAndCount();

    const resultItems = items.map(item => {
      const { school, ...rest } = item;
      return {
        ...rest,
        school_name: school?.name || '',
      };
    });

    return { items: resultItems, total };
  }

  async findOne(id: string): Promise<College> {
    const college = await this.collegeRepository.findOne({ where: { id } });
    if (!college) {
      throw new NotFoundException('学院不存在');
    }
    return college;
  }

  async update(id: string, data: Partial<College>): Promise<College> {
    const college = await this.findOne(id);
    await this.collegeRepository.update(id, data);
    return await this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const college = await this.findOne(id);

    // 校验：是否有学生属于该学院
    const studentCount = await this.studentRepository.count({
      where: { college_id: id },
    });

    if (studentCount > 0) {
      throw new BadRequestException('该学院下仍有学生，无法删除');
    }

    await this.collegeRepository.delete(id);
  }
}
