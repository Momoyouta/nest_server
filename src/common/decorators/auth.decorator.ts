import {applyDecorators, SetMetadata} from "@nestjs/common";
import {API_PUBLIC, ROLES_KEY} from "@/common/constants/decoratorKey"
export const Public = () => SetMetadata(API_PUBLIC, true);