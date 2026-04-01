import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, PrimaryColumn } from 'typeorm';

export type ChunkStatus = 'pending' | 'merging' | 'done' | 'expired';

@Entity('file_chunk')
export class FileChunk {
  @ApiProperty({ description: '上传任务ID（UUID）', example: 'uuid-v4' })
  @PrimaryColumn({ type: 'varchar', length: 255 })
  id: string;

  @ApiProperty({ description: '文件MD5 hash', example: 'abc123...' })
  @Column({ name: 'file_hash', type: 'varchar', length: 255, unique: true })
  fileHash: string;

  @ApiProperty({ description: '原始文件名', example: 'lecture01.mp4' })
  @Column({ name: 'file_name', type: 'varchar', length: 255 })
  fileName: string;

  @ApiProperty({ description: '文件总大小（bytes）', example: 524288000 })
  @Column({ name: 'file_size', type: 'bigint' })
  fileSize: number;

  @ApiProperty({ description: '分片总数', example: 50 })
  @Column({ name: 'total_chunks', type: 'int' })
  totalChunks: number;

  @ApiProperty({ description: '已上传的分片索引列表', example: [0, 1, 2] })
  @Column({ name: 'uploaded_chunks', type: 'json' })
  uploadedChunks: number[];

  @ApiProperty({
    description: '上传状态：pending/merging/done/expired',
    example: 'pending',
    default: 'pending',
  })
  @Column({ name: 'status', type: 'varchar', length: 50, default: 'pending' })
  status: ChunkStatus;

  @ApiProperty({
    description: '目标存储相对路径',
    example: 'schools/1/courses/2/chapters/3/lessons/4',
    nullable: true,
  })
  @Column({ name: 'target_path', type: 'varchar', length: 500, nullable: true })
  targetPath: string | null;

  @ApiProperty({ description: '创建时间', example: '2026-03-27T00:00:00.000Z' })
  @Column({
    name: 'create_time',
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createTime: Date;

  @ApiProperty({ description: '更新时间', example: '2026-03-27T00:00:00.000Z' })
  @Column({
    name: 'update_time',
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updateTime: Date;
}
