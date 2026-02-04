import {Injectable} from "@nestjs/common";
import {JwtModuleOptions, JwtOptionsFactory} from "@nestjs/jwt";
import * as fs from "fs";
import {join} from "node:path";


@Injectable()
export class JwtConfigService implements JwtOptionsFactory {
    private readonly privateKey: any;
    private readonly publicKey: any;

    constructor() {
        // 在构造函数中读取，避免每次调用都读取文件
        const priKeyPath = join('src/common/constants/private.key');
        const pubKeyPath = join('src/common/constants/public.key');
        console.log('私钥路径:', priKeyPath);
        console.log('公钥路径:', pubKeyPath);
        // 检查文件是否存在
        if (!fs.existsSync(priKeyPath)) {
            throw new Error(`私钥文件不存在: ${priKeyPath}`);
        }
        if (!fs.existsSync(pubKeyPath)) {
            throw new Error(`公钥文件不存在: ${pubKeyPath}`);
        }
        // 读取密钥文件
        this.privateKey = fs.readFileSync(priKeyPath);
        this.publicKey = fs.readFileSync(pubKeyPath);
    }
    createJwtOptions(): JwtModuleOptions {
        return {
            privateKey: this.privateKey,
            publicKey: this.publicKey,
            signOptions: {
                algorithm: 'RS256', // 算法
                expiresIn: '30s',   // 过期时间
                issuer: 'momo', // 签发者
                audience: 'client', // 接收者
            },
            verifyOptions: {
                algorithms: ['RS256'], // 算法
                issuer: 'momo', // 签发者
                audience: 'client', // 接收者
            },
            global: true
        }
    }
}