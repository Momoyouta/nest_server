import {applyDecorators, SetMetadata} from "@nestjs/common";
import {API_PUBLIC, ROLES_KEY} from "@/common/constants/decoratorKey"
export const Public = () => SetMetadata(API_PUBLIC, true);
export function Role(...roles: string[]) {
    return applyDecorators(
        SetMetadata(ROLES_KEY,roles),
        
        
    )
}