import { SetMetadata } from '@nestjs/common';

export const ADMIN_AUTH_KEY = 'ADMIN_AUTH';
export const AdminAuth = () => SetMetadata(ADMIN_AUTH_KEY, true);
