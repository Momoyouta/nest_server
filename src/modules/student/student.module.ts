import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Student } from '../../database/entities/student.entity';
import { User } from '../../database/entities/user.entity';
import { StudentController } from '@/modules/student/student.controller';
import { StudentService } from '@/modules/student/student.service';
import { UserModule } from '../user/user.module';
import { UserService } from '../user/user.service';

@Module({
  imports: [UserModule],
  controllers: [StudentController],
  providers: [StudentService, UserService],
  exports: [StudentService],
})
export class StudentModule { }
