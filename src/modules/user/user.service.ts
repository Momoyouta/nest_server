import {Injectable} from "@nestjs/common";
import {InjectRepository} from "@nestjs/typeorm";
import {In, Repository, Transaction} from "typeorm";
import {User} from "../../database/entities/user.entity";
import {Role} from "@/database/entities/role.entity";

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        @InjectRepository(Role)
        private roleRepository: Repository<Role>,
    ) {}
    
    login(account: string, password: string): any {
        
    }
    
    
    async getUser(id: string): Promise<any> {
        return await this.usersRepository.findOneBy({id})
            .then(user => {
                return {code: 200, user: user};
            })
            .catch(err => {
                console.log(err);
                throw new Error('server error');
            });
    }
    
    getHello(): any {
        return "Hello World!";
    }
    
    async getUserRole(id: string): Promise<any> {
        const user = await this.usersRepository.findOne({
            select: ["role_id"],
            where: {id}
        })
        let roles: any[] = [];
        const roleIds = user?.role_id.split(',') || [];
        console.log(roleIds);
        if (roleIds.length > 0) {
            roles = await this.roleRepository.findBy({
                id: In(roleIds),
            });
        }
        return roles;
    }
}