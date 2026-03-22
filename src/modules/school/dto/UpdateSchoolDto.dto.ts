import { PartialType } from '@nestjs/swagger';
import { CreateSchoolDto } from './CreateSchoolDto.dto';

export class UpdateSchoolDto extends PartialType(CreateSchoolDto) {}
