import { Redis } from 'ioredis';
import * as crypto from 'crypto';
const prefix = 'invite:';
/**
 * 生成16位随机邀请码（字母+数字）
 * 使用 crypto 确保更高的随机性和唯一性
 * @param length 长度，默认为16
 * @returns 随机字符串
 */
export function generateInviteCode(length: number = 16): string {
  return crypto
    .randomBytes(Math.ceil(length / 2))
    .toString('hex')
    .slice(0, length);
}

/**
 * 创建邀请码并存入 Redis
 * @param redis Redis 客户端实例
 * @param code 邀请码
 * @param value 关联的值
 * @param ttl 过期时间（秒），可选
 */
export async function createInviteCode<T>(
  redis: Redis,
  code: string,
  value: T,
  ttl?: number,
): Promise<void> {
  const stringValue = JSON.stringify(value);
  const key = prefix + code;
  if (ttl) {
    await redis.set(key, stringValue, 'EX', ttl);
  } else {
    await redis.set(key, stringValue);
  }
}

/**
 * 根据邀请码从 Redis 获取关联的值
 * @param redis Redis 客户端实例
 * @param code 邀请码
 * @returns 关联的值或 null
 */
export async function getInviteValue<T>(
  redis: Redis,
  code: string,
): Promise<T | null> {
  const errMsg = '邀请码不存在或已过期';
  const key = prefix + code;
  const value = await redis.get(key);
  if (!value) return errMsg as T;

  try {
    return JSON.parse(value) as T;
  } catch (e) {
    return errMsg as T;
  }
}
