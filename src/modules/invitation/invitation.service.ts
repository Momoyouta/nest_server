import { Inject, Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';
import { generateInviteCode, createInviteCode } from '@/common/utils/invite.util';
import { CreateInviteDto, InvitationDataDto, InvitationQueryDto } from '@/common/dto/invite.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { InvitationCode } from '@/database/entities/invitation_code.entity';
import { Repository } from 'typeorm';
import { School } from '@/database/entities/school.entity';
import { User } from '@/database/entities/user.entity';

@Injectable()
export class InvitationService {
  constructor(
    @Inject('REDIS_CLIENT')
    private readonly redis: Redis,
    @InjectRepository(InvitationCode)
    private readonly invitationRepository: Repository<InvitationCode>,
  ) { }

  /**
   * 创建邀请码并存储到数据库和 Redis
   */
  async createInvite(dto: CreateInviteDto, creatorId: string): Promise<string> {
    const code = generateInviteCode(16);
    const now = String(Math.floor(Date.now() / 1000));

    // 1. 存储到数据库
    const invite = this.invitationRepository.create({
      code,
      type: dto.type,
      school_id: dto.school_id,
      grade: dto.grade,
      class_id: dto.class_id,
      creater_id: creatorId,
      create_time: now,
      ttl: dto.ttl,
    });
    await this.invitationRepository.save(invite);

    // 2. 存储到 Redis (用于快速校验)
    const invitationData: InvitationDataDto = {
      type: dto.type,
      school_id: dto.school_id,
      grade: dto.grade,
      class_id: dto.class_id,
      creater_id: creatorId,
      create_time: now,
    };
    await createInviteCode(this.redis, code, invitationData, dto.ttl);

    return code;
  }

  /**
   * 删除邀请码
   */
  async deleteInvite(code: string): Promise<void> {
    await this.invitationRepository.delete({ code });
    const prefix = 'invite:';
    await this.redis.del(prefix + code);
  }

  /**
   * 获取邀请码列表 (带分页和多条件过滤)
   */
  async findAll(query: InvitationQueryDto) {
    const { page = 1, pageSize = 10, code, creater_id, school_id, class_id, grade, type } = query;

    const qb = this.invitationRepository.createQueryBuilder('ic')
      .leftJoin(School, 's', 'ic.school_id = s.id')
      .leftJoin(User, 'u', 'ic.creater_id = u.id')
      .select([
        'ic.code as code',
        'ic.type as type',
        'ic.school_id as school_id',
        's.name as school_name',
        'ic.grade as grade',
        'ic.class_id as class_id',
        'ic.creater_id as creater_id',
        'u.name as creator_name',
        'ic.create_time as create_time',
        'ic.ttl as ttl',
      ]);

    if (code) qb.andWhere('ic.code LIKE :code', { code: `%${code}%` });
    if (creater_id) qb.andWhere('ic.creater_id = :creater_id', { creater_id });
    if (school_id) qb.andWhere('ic.school_id = :school_id', { school_id });
    if (class_id) qb.andWhere('ic.class_id = :class_id', { class_id });
    if (grade) qb.andWhere('ic.grade LIKE :grade', { grade: `%${grade}%` });
    if (type !== undefined) qb.andWhere('ic.type = :type', { type });

    const total = await qb.getCount();
    const list = await qb
      .offset((page - 1) * pageSize)
      .limit(pageSize)
      .getRawMany();

    return { list, total };
  }

  /**
   * 获取邀请码对应的数据 (用于校验)
   */
  async getInviteData(code: string): Promise<InvitationDataDto | null> {
    // 优先从库里查，确保数据结构一致
    const invite = await this.invitationRepository.findOne({ where: { code } });
    if (!invite) return null;

    return {
      type: invite.type,
      school_id: invite.school_id,
      grade: invite.grade,
      class_id: invite.class_id,
      creater_id: invite.creater_id,
      create_time: invite.create_time,
      ttl: invite.ttl,
    };
  }
}
