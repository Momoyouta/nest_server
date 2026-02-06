import { SetMetadata } from '@nestjs/common';
export const TRANSACTION_METADATA = 'transaction_metadata';
export function Transactional() {
  return SetMetadata(TRANSACTION_METADATA, {
    enabled: true,
    isolationLevel: null, // 使用默认隔离级别
  });
}
