import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { API_PUBLIC } from '@/common/constants/decoratorKey';
import { AsyncLocalstorageService } from '@/modules/async/async/asyncLocalstorage.service';
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private reflector: Reflector,
    private alsService: AsyncLocalstorageService,
  ) {}
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const isPublic = this.reflector.getAllAndOverride<boolean>(API_PUBLIC, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      // 如果是公共接口，则跳过校验
      return true;
    }
    if (!request) {
      return false;
    }
    const token = request.headers.authorization.split(' ')[1];
    let payload: any;
    try {
      payload = this.jwtService.verify(token);
      const userId = payload?.userId;
      const context = this.alsService.getStore();
      if (userId && context) {
        context.userId = payload.userId;
      }
      console.log(payload, 'payload');
      return true;
    } catch (e) {
      console.log('payload: ', e);
      if (e.name === 'TokenExpiredError') {
        throw new HttpException(
          '令牌已过期，请重新登录',
          HttpStatus.UNAUTHORIZED,
        );
      } else if (e.name === 'JsonWebTokenError') {
        throw new HttpException('令牌无效，请检查', HttpStatus.UNAUTHORIZED);
      } else {
        throw new HttpException('认证失败', HttpStatus.UNAUTHORIZED);
      }
    }
  }
}
