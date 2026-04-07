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
  ) {}
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
        // 保持 @AdminAuth 与管理员 token 验证逻辑不变
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
        
        // pending token 访问控制：如果尚未选校，仅允许访问认证/选校接口
        const isAuthRoute = request.url.startsWith('/api/auth/selectSchool') || 
                            request.url.startsWith('/api/auth/schools') || 
                            request.url.startsWith('/api/auth/switchSchool') ||
                            request.url.startsWith('/api/auth/join-school') ||
                            request.url.startsWith('/auth/selectSchool') ||
                            request.url.startsWith('/auth/schools') ||
                            request.url.startsWith('/auth/switchSchool') ||
                            request.url.startsWith('/auth/join-school') ||
                            request.url.startsWith('/api/auth/jwtAuth') ||
                            request.url.startsWith('/auth/jwtAuth');

        if (payload.tokenType === 'pending-school' && !isAuthRoute) {
          throw new HttpException('请先选择学校', HttpStatus.FORBIDDEN);
        }
      }
      
      if (context) {
        if (payload.userId) {
          context.userId = payload.userId;
        }
        if (payload.roleIds) {
          context.roleIds = typeof payload.roleIds === 'string' ? payload.roleIds.split(',') : payload.roleIds;
        }
        if (payload.schoolId) context.schoolId = payload.schoolId;
        if (payload.actorType) context.actorType = payload.actorType;
        if (payload.actorId) context.actorId = payload.actorId;
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
              context.roleIds = typeof roleIds === 'string' ? roleIds.split(',') : roleIds;
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
