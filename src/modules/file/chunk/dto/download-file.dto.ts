import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class DownloadFileDto {
  @ApiProperty({ description: '学校ID', example: '1' })
  @IsNotEmpty({ message: 'schoolId 不能为空' })
  @IsString()
  schoolId: string;

  @ApiProperty({ description: '文件MD5哈希值', example: 'abc123hash' })
  @IsNotEmpty({ message: 'fileHash 不能为空' })
  @IsString()
  fileHash: string;
}
