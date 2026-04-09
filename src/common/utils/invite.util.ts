import { Redis } from 'ioredis';
import * as crypto from 'crypto';

const prefix = 'invite:';
const ALGORITHM = 'aes-256-cbc';
const SECRET_KEY = Buffer.from(
  (process.env.INVITATION_SECRET || 'a_very_secure_default_32_char_key!').slice(
    0,
    32,
  ),
);
const IV_LENGTH = 16;

/**
 * 字段映射字典（压缩体积）
 */
const fieldMap: Record<string, string> = {
  type: 't',
  school_id: 's',
  grade: 'g',
  class_id: 'cl',
  course_id: 'co',
  teaching_group_id: 'tg',
  creater_id: 'cr',
  create_time: 'ct',
  ttl: 'ttl',
  college_id: 'ci',
};

// 反向映射
const reverseFieldMap = Object.fromEntries(
  Object.entries(fieldMap).map(([k, v]) => [v, k]),
);

/**
 * 加密邀请码
 */
export function encryptInvitation(data: any): string {
  const compactData: any = {};
  for (const key in data) {
    if (data[key] !== undefined && fieldMap[key]) {
      compactData[fieldMap[key]] = data[key];
    }
  }

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, iv);
  let encrypted = cipher.update(JSON.stringify(compactData), 'utf8', 'base64');
  encrypted += cipher.final('base64');

  // 返回格式：iv:encryptedData，并进行 URL 安全的 Base64 替换
  return (iv.toString('base64') + ':' + encrypted)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * 解密邀请码
 */
export function decryptInvitation(code: string): any | null {
  try {
    // 还原 URL 安全的 Base64
    const normalizedCode = code.replace(/-/g, '+').replace(/_/g, '/');
    const parts = normalizedCode.split(':');
    if (parts.length !== 2) return null;

    const iv = Buffer.from(parts[0], 'base64');
    const encryptedText = Buffer.from(parts[1], 'base64');
    const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, iv);

    let decrypted = decipher.update(encryptedText, undefined, 'utf8');
    decrypted += decipher.final('utf8');

    const compactData = JSON.parse(decrypted);
    const originalData: any = {};
    for (const key in compactData) {
      if (reverseFieldMap[key]) {
        originalData[reverseFieldMap[key]] = compactData[key];
      }
    }
    return originalData;
  } catch (e) {
    return null;
  }
}

/**
 * 生成邀请码（新逻辑：加密）
 */
export function generateInviteCode(data: any): string {
  return encryptInvitation(data);
}

/**
 * 创建邀请码并存入 Redis
 */
export async function createInviteCode<T>(
  redis: Redis,
  code: string,
  value: T,
  ttl?: number,
): Promise<void> {
  const stringValue = JSON.stringify(value);
  const key = prefix + code;
  if (ttl && ttl > 0) {
    await redis.set(key, stringValue, 'EX', ttl);
  } else {
    await redis.set(key, stringValue);
  }
}

/**
 * 根据邀请码从 Redis 获取关联的值（新逻辑：优先校验 Redis，再解密）
 */
export async function getInviteValue<T>(
  redis: Redis,
  code: string,
): Promise<T | null> {
  const key = prefix + code;
  const exists = await redis.exists(key);
  if (!exists) return null;

  // 如果 Redis 中只作为标记（value 为 1），则尝试解析 code 本身
  const value = await redis.get(key);
  if (value === '1' || !value) {
    return decryptInvitation(code) as T;
  }

  try {
    return JSON.parse(value) as T;
  } catch (e) {
    return decryptInvitation(code) as T;
  }
}
