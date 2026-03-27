import { SetMetadata } from '@nestjs/common';
import { API_PUBLIC, ALL_JWT_AUTH } from '@/common/constants/decoratorKey';
export const Public = () => SetMetadata(API_PUBLIC, true);
export const AllJwtAuth = () => SetMetadata(ALL_JWT_AUTH, true);
