import {CanActivate, ExecutionContext} from "@nestjs/common";
import {Reflector} from "@nestjs/core";
import {ROLES_KEY} from "@/common/constants/decoratorKey";

export class RoleGuard implements CanActivate {
    constructor(private reflector: Reflector) {}
    
    canActivate(context: ExecutionContext): boolean {
        const role = this.reflector.get<string[]>(ROLES_KEY, context.getHandler());
        return false
    }
}