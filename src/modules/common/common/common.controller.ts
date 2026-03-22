import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('基础服务')
@Controller('common')
export class CommonController {}
