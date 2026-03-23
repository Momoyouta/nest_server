import { PickType } from '@nestjs/swagger';
import { User } from '@/database/entities/user.entity';
import { IsNotEmpty, IsString } from 'class-validator';

export class RegisterUserDto extends PickType(User, [
  'id',
  'name',
  'role_id',
  'sex',
  'account',
  'phone',
  'password',
] as const) {
  @IsString()
  @IsNotEmpty()
  inviteCode: string;

  status: number;
}
