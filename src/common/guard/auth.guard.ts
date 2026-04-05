/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ALL_JWT_AUTH, API_PUBLIC } from '@/common/constants/decoratorKey';
import { AsyncLocalstorageService } from '@/modules/async/async/asyncLocalstorage.service';
import { ADMIN_AUTH_KEY } from '@/common/decorators/admin-auth.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private reflector: Reflector,
    private alsService: AsyncLocalstorageService,
  ) { }
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const isPublic = this.reflector.getAllAndOverride<boolean>(API_PUBLIC, [
      context.getHandler(),
      context.getClass(),
    ]);
    const allowAllJwtAuth = this.reflector.getAllAndOverride<boolean>(
      ALL_JWT_AUTH,
      [context.getHandler(), context.getClass()],
    );
    const isAdminAuth = this.reflector.getAllAndOverride<boolean>(
      ADMIN_AUTH_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (isPublic) {
      // 如果是公共接口，则跳过校验
      return true;
    }
    if (!request || !request.headers.authorization) {
      return false;
    }
    const token = request.headers.authorization.split(' ')[1];
    let payload: any;
    try {
      const context = this.alsService.getStore();
      if (isAdminAuth) {
        payload = this.jwtService.verify(token, {
          secret: process.env.ADMIN_JWT_SECRET || 'nest_admin_secret',
          algorithms: ['HS256'],
        });
        if (context) {
          context.platform = 'admin';
        }
      } else {
        payload = this.jwtService.verify(token);
        if (context) {
          context.platform = 'user';
        }
      }
      const userId = payload?.userId;
      const roleIds = payload?.roleIds;
      if (context) {
        if (userId) {
          context.userId = payload.userId;
        }
        if (roleIds) {
          context.roleIds = payload.roleIds;
        }
      }
      return true;
    } catch (e) {
      if (allowAllJwtAuth) {
        try {
          payload = this.jwtService.verify(token, {
            secret: process.env.ADMIN_JWT_SECRET || 'nest_admin_secret',
            algorithms: ['HS256'],
          });
          const userId = payload?.userId;
          const roleIds = payload?.roleIds;
          const context = this.alsService.getStore();
          if (context) {
            context.platform = 'admin';
            if (userId) {
              context.userId = payload.userId;
            }
            if (roleIds) {
              context.roleIds = payload.roleIds;

            }
          }
          return true;
        } catch (e2) {
          throw new HttpException('令牌无效，请检查', HttpStatus.UNAUTHORIZED);
        }
      }
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
