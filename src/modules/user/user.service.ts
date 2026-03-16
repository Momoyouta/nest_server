import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { Role } from '@/database/entities/role.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
  ) {}

  login(): any {}

  async getUser(id: string): Promise<{ code: number; user: User | null }> {
    return await this.usersRepository
      .findOneBy({ id })
      .then((user) => {
        return { code: 200, user: user };
      })
      .catch((err) => {
        console.log(err);
        throw new Error('server error');
      });
  }

  /**
   * 创建用户
   */
  async createUser(data: Partial<User>): Promise<User> {
    const user = this.usersRepository.create(data);
    return await this.usersRepository.save(user);
  }

  /**
   * 更新用户信息
   */
  async updateUser(id: string, data: Partial<User>): Promise<User> {
    const result = await this.usersRepository.update(id, data);
    if (result.affected === 0) {
      throw new NotFoundException('用户不存在');
    }
    const updatedUser = await this.usersRepository.findOneBy({ id });
    if (!updatedUser) {
      throw new NotFoundException('用户不存在');
    }
    return updatedUser;
  }

  /**
   * 删除用户
   */
  async deleteUser(id: string): Promise<{ code: number; message: string }> {
    const result = await this.usersRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('用户不存在');
    }
    return { code: 200, message: '删除成功' };
  }

  getHello(): string {
    return 'Hello World!';
  }

  async getUserRole(id: string): Promise<Role[]> {
    return this.getUserRolesDetails(id);
  }

  async getUserRolesDetails(id: string): Promise<Role[]> {
    const user = await this.usersRepository.findOne({
      select: ['role_id'],
      where: { id },
    });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    if (!user.role_id) {
      return [];
    }
    const roleIds = user.role_id.split(',').filter((id) => id.trim() !== '');
    if (roleIds.length === 0) {
      return [];
    }
    return await this.roleRepository.findBy({
      id: In(roleIds),
    });
  }

  async updateUserRoles(
    id: string,
    roleIds: string[],
  ): Promise<{ code: number; message: string }> {
    const roleIdStr = roleIds.join(',');
    const result = await this.usersRepository.update(id, {
      role_id: roleIdStr,
    });
    if (result.affected === 0) {
      throw new NotFoundException('用户不存在');
    }
    return { code: 200, message: '更新成功' };
  }
}
