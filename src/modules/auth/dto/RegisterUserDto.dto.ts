import {PickType} from "@nestjs/swagger";
import {User} from "@/database/entities/user.entity";

export class RegisterUserDto extends PickType(
    User,
    ['id', 'name', 'role_id', 'sex', 'account', 'password'] as const
){}