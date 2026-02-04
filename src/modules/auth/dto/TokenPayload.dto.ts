import {User} from "@/database/entities/user.entity";

export class TokenPayloadDto {
    userId: string;
    roles: string[];
    roleIds: string;
}