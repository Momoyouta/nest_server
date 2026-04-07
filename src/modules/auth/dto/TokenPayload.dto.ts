import { User } from '@/database/entities/user.entity';

export class TokenPayloadDto {
  userId: string;
  roles: string[];
  roleIds: string;
  tokenType?: 'pending-school' | 'access';
  schoolId?: string;
  actorType?: number;
  actorId?: string;
  selectableSchoolIds?: string[];
}
