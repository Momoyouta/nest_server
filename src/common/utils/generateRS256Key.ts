// generate-rsa-keys.ts
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

export function generateRSAKeyPair(bits: number = 2048) {
    // 生成密钥对
    const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: bits,
        publicKeyEncoding: {
            type: 'spki',       // 标准公钥格式
            format: 'pem',      // PEM 格式
        },
        privateKeyEncoding: {
            type: 'pkcs8',      // 推荐的私钥格式
            format: 'pem',      // PEM 格式
        },
    });

    return { privateKey, publicKey };
}

// 生成并保存
const keysDir = path.join(__dirname, 'keys');
if (!fs.existsSync(keysDir)) {
    fs.mkdirSync(keysDir, { recursive: true });
}

const { privateKey, publicKey } = generateRSAKeyPair(1024);

fs.writeFileSync(path.join(keysDir, 'private.key'), privateKey);
fs.writeFileSync(path.join(keysDir, 'public.key'), publicKey);

console.log('✅ RSA 密钥对生成成功！');
console.log(`私钥: ${path.join(keysDir, 'private.key')}`);
console.log(`公钥: ${path.join(keysDir, 'public.key')}`);