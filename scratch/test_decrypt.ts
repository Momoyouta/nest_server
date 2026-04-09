import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const SECRET_KEY = Buffer.from(
  ('a_very_secure_default_32_char_key!').slice(0, 32),
);

function decryptInvitation(code: string): any | null {
  try {
    const normalizedCode = code.replace(/-/g, '+').replace(/_/g, '/');
    const parts = normalizedCode.split(':');
    if (parts.length !== 2) {
      console.log('Split failed');
      return null;
    }

    const iv = Buffer.from(parts[0], 'base64');
    const encryptedText = Buffer.from(parts[1], 'base64');
    const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, iv);

    let decrypted = decipher.update(encryptedText, undefined, 'utf8');
    decrypted += decipher.final('utf8');

    return JSON.parse(decrypted);
  } catch (e) {
    console.log('Error:', e.message);
    return null;
  }
}

const code = 'kcITsL4GHfAtGCs5xbzQkw==:H3k4FVXnjPxc9_smEcsVy_TTjBOXONDyIixUFOOvOJ9mYF6zxGJnPs_kgFfWP4iJa-Dd4eUslvqxDRk_ZbbkBezN3Qpd7UI9_Z7jTgyHZ41QCBJwkNjxyFUHLeQ4nRBy59NU_lm3zXxq4ys7WnpK2w';
console.log('Decrypted:', decryptInvitation(code));
