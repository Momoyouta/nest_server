import { SetMetadata } from '@nestjs/common';
import { API_PUBLIC } from '@/common/constants/decoratorKey';
export const Public = () => SetMetadata(API_PUBLIC, true);
