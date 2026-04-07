import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  Max,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { CourseStatusMap, CourseStatusValues } from '@/common/utils/course.map';
import {
  CourseOutlineSourceMap,
  CourseOutlineSourceValues,
} from '@/common/utils/course-outline.map';

export class TeacherSimpleDto {
  @ApiProperty({ description: '教师ID' })
  id: string;

  @ApiProperty({ description: '教师姓名' })
  name: string;
}

export class CreateCourseDto {
  @ApiProperty({ description: '课程名称', example: '高等数学一' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({
    description: '学校ID，平台管理员必填',
    example: 'school-uuid',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  school_id?: string;

  @ApiPropertyOptional({
    description: '课程封面图',
    example: '/fileStore/course/cover/a.png',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  cover_img?: string;

  @ApiPropertyOptional({
    description: '课程描述',
    example: '本课程讲解高等数学基础知识。',
  })
  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateCourseTeacherDto {
  @ApiProperty({ description: '课程名称', example: '高等数学一' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;
}

export class UpdateCourseDto {
  @ApiProperty({ description: '课程ID' })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiPropertyOptional({ description: '课程名称', example: '高等数学二' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({
    description: '课程封面图',
    example: '/fileStore/course/cover/b.png',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  cover_img?: string;

  @ApiPropertyOptional({
    description: '课程状态: 0-未发布, 1-已发布',
    enum: CourseStatusValues,
    example: CourseStatusMap.PUBLISHED,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn(CourseStatusValues)
  status?: number;

  @ApiPropertyOptional({
    description: '课程简介',
    example: '本课程讲解高等数学基础知识。',
  })
  @IsOptional()
  @IsString()
  @MaxLength(65535)
  description?: string;
}

export class UpdateCourseCoverDto {
  @ApiProperty({ description: '课程ID' })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiPropertyOptional({
    description: '临时文件相对路径，为空则删除原封面',
    example: 'uploads/temp/images/xxx.png',
  })
  @IsOptional()
  @IsString()
  temp_path?: string;
}

export class CourseDeleteParamDto {
  @ApiProperty({ description: '课程ID' })
  @IsString()
  @IsNotEmpty()
  id: string;
}

export class CourseListQueryDto {
  @ApiPropertyOptional({ description: '页码', default: 1, example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: '每页条数', default: 10, example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number = 10;

  @ApiPropertyOptional({ description: '课程名称关键词', example: '数学' })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({
    description: '课程状态: 0-未发布, 1-已发布',
    enum: CourseStatusValues,
    example: CourseStatusMap.UNPUBLISHED,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn(CourseStatusValues)
  status?: number;

  @ApiPropertyOptional({
    description: '学校ID，平台管理员必填',
    example: 'school-uuid',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  school_id?: string;
}

export class CourseLessonOutlineQueryDto {
  @ApiPropertyOptional({
    description:
      '返回数据源，仅 admin 平台生效：draft=优先草稿，published=已发布内容',
    enum: CourseOutlineSourceValues,
    example: CourseOutlineSourceMap.DRAFT,
  })
  @IsOptional()
  @IsString()
  @IsIn(CourseOutlineSourceValues)
  source?: string;
}

export class BindTeachingGroupTeachersAdminDto {
  @ApiProperty({ description: '课程ID' })
  @IsString()
  @IsNotEmpty()
  course_id: string;

  @ApiProperty({ description: '教学组ID' })
  @IsString()
  @IsNotEmpty()
  teaching_group_id: string;

  @ApiProperty({
    description: '教学组绑定教师ID列表',
    type: [String],
    example: ['teacher-1', 'teacher-2'],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  teacher_ids: string[];
}

export class BindTeachingGroupTeachersAdminResponseDto {
  @ApiProperty({ description: '课程ID' })
  course_id: string;

  @ApiProperty({ description: '教学组ID' })
  teaching_group_id: string;

  @ApiProperty({
    description: '最终绑定的教师ID列表',
    type: [String],
  })
  teacher_ids: string[];

  @ApiProperty({ description: '是否更新成功', example: true })
  updated: true;
}

export class QuerySchoolTeacherByNameAdminDto {
  @ApiPropertyOptional({
    description: '学校ID，平台管理员必填，学校管理员可不传',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  school_id?: string;

  @ApiProperty({ description: '教师姓名前缀关键词', example: '张' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: '页码', default: 1, example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: '每页条数', default: 10, example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number = 10;
}

export class SchoolTeacherItemDto {
  @ApiProperty({ description: '教师ID' })
  id: string;

  @ApiProperty({ description: '教师姓名' })
  name: string;
}

export class QuerySchoolTeacherByNameAdminResponseDto {
  @ApiProperty({ type: [SchoolTeacherItemDto] })
  list: SchoolTeacherItemDto[];

  @ApiProperty({ description: '总数', example: 20 })
  total: number;
}

export class CreateTeachingGroupAdminDto {
  @ApiProperty({ description: '课程ID' })
  @IsString()
  @IsNotEmpty()
  course_id: string;

  @ApiProperty({ description: '教学组名称', example: '一班教学组' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;
}

export class CreateTeachingGroupAdminResponseDto {
  @ApiProperty({ description: '教学组ID' })
  id: string;

  @ApiProperty({ description: '课程ID' })
  course_id: string;

  @ApiProperty({ description: '教学组名称' })
  name: string;

  @ApiProperty({
    description: '教学组内教师姓名列表',
    type: [String],
    example: ['张三'],
  })
  teachers: string[];
}

export class UpdateTeachingGroupAdminDto {
  @ApiProperty({ description: '教学组ID' })
  @IsString()
  @IsNotEmpty()
  teaching_group_id: string;

  @ApiProperty({ description: '教学组名称', example: '二班教学组' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;
}

export class UpdateTeachingGroupAdminResponseDto {
  @ApiProperty({ description: '教学组ID' })
  id: string;

  @ApiProperty({ description: '是否更新成功', example: true })
  updated: true;
}

export class TeachingGroupIdParamDto {
  @ApiProperty({ description: '教学组ID' })
  @IsString()
  @IsNotEmpty()
  id: string;
}

export class ListTeachingGroupAdminQueryDto {
  @ApiProperty({ description: '课程ID' })
  @IsString()
  @IsNotEmpty()
  course_id: string;

  @ApiPropertyOptional({ description: '页码', default: 1, example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: '每页条数', default: 10, example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number = 10;
}

export class TeachingGroupItemDto {
  @ApiProperty({ description: '教学组ID' })
  id: string;

  @ApiProperty({ description: '课程ID' })
  course_id: string;

  @ApiProperty({ description: '教学组名称' })
  name: string;

  @ApiProperty({
    description: '教学组内教师列表',
    type: [TeacherSimpleDto],
  })
  teachers: TeacherSimpleDto[];

  @ApiPropertyOptional({ description: '创建时间戳(s)' })
  create_time?: string;

  @ApiPropertyOptional({
    description: '该教学组最近课程邀请码创建时间戳(s)',
    nullable: true,
  })
  invitation_create_time?: string | null;

  @ApiPropertyOptional({
    description: '该教学组邀请码，可能为null表示无邀请码或邀请码已过期',
    nullable: true,
  })
  invitation_code?: string | null;

  @ApiPropertyOptional({
    description: '该教学组最近课程邀请码ttl(s)',
    nullable: true,
  })
  invitation_ttl?: number | null;
}

export class GetTeachingGroupAdminResponseDto extends TeachingGroupItemDto {}

export class ListTeachingGroupAdminResponseDto {
  @ApiProperty({ type: [TeachingGroupItemDto] })
  list: TeachingGroupItemDto[];

  @ApiProperty({ description: '总数', example: 20 })
  total: number;
}

export class DeleteTeachingGroupAdminResponseDto {
  @ApiProperty({ description: '教学组ID' })
  id: string;

  @ApiProperty({ description: '是否删除成功', example: true })
  deleted: true;
}

export class CourseListItemDto {
  @ApiProperty({ description: '课程ID' })
  id: string;

  @ApiProperty({ description: '学校ID' })
  school_id: string;

  @ApiProperty({ description: '创建人ID' })
  creator_id: string;

  @ApiProperty({ description: '课程名称' })
  name: string;

  @ApiPropertyOptional({ description: '封面图' })
  cover_img?: string;

  @ApiProperty({
    description: '课程状态: 0-未发布, 1-已发布',
    enum: CourseStatusValues,
  })
  status: number;

  @ApiPropertyOptional({ description: '创建时间戳(s)' })
  create_time?: string;

  @ApiPropertyOptional({ description: '更新时间戳(s)' })
  update_time?: string;

  @ApiProperty({ description: '学校名称', example: '第一中学' })
  school_name: string;

  @ApiProperty({
    description: '任课老师列表',
    type: [TeacherSimpleDto],
  })
  @IsArray()
  teacher_names: TeacherSimpleDto[];

  @ApiPropertyOptional({ description: '创建者姓名', example: '王老师' })
  creator_name?: string;
}

export class CourseListResponseDto {
  @ApiProperty({ type: [CourseListItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CourseListItemDto)
  list: CourseListItemDto[];

  @ApiProperty({ description: '总数', example: 100 })
  @IsInt()
  total: number;
}

export class ListTeacherCoursesQueryDto {
  @ApiPropertyOptional({ description: '页码', default: 1, example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: '每页条数', default: 10, example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number = 10;

  @ApiPropertyOptional({ description: '老师ID (已废弃)', example: 'teacher-uuid' })
  @IsOptional()
  @IsString()
  teacher_id?: string;

  @ApiPropertyOptional({ description: '学校ID，可选', example: 'school-uuid' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  school_id?: string;
}

export class ListStudentCoursesQueryDto {
  @ApiPropertyOptional({ description: '页码', default: 1, example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: '每页条数', default: 10, example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number = 10;

  @ApiPropertyOptional({ description: '学生ID (已废弃)', example: 'student-uuid' })
  @IsOptional()
  @IsString()
  student_id?: string;

  @ApiPropertyOptional({ description: '学校ID，可选', example: 'school-uuid' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  school_id?: string;
}

export class ListMyCreatedCoursesQueryDto {
  @ApiPropertyOptional({ description: '页码', default: 1, example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: '每页条数', default: 10, example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number = 10;

  @ApiPropertyOptional({ description: '课程名称关键词', example: '数学' })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({ description: '学校ID，可选', example: 'school-uuid' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  school_id?: string;
}

export class CourseUserListItemDto {
  @ApiProperty({ description: '课程ID' })
  course_id: string;

  @ApiProperty({ description: '学校ID' })
  school_id: string;

  @ApiProperty({ description: '创建人ID' })
  creator_id: string;

  @ApiProperty({ description: '课程名称' })
  name: string;

  @ApiPropertyOptional({ description: '封面图' })
  cover_img?: string;

  @ApiProperty({
    description: '课程状态: 0-未发布, 1-已发布',
    enum: CourseStatusValues,
  })
  status: number;

  @ApiPropertyOptional({ description: '创建时间戳(s)' })
  create_time?: string;

  @ApiPropertyOptional({ description: '更新时间戳(s)' })
  update_time?: string;

  @ApiProperty({ description: '学校名称', example: '第一中学' })
  school_name: string;

  @ApiProperty({ description: '所在教学组ID', example: 'group-uuid' })
  group_id: string;

  @ApiProperty({
    description: '对应教学组任课老师列表',
    type: [TeacherSimpleDto],
  })
  @IsArray()
  teacher_names: TeacherSimpleDto[];
}

export class CourseUserListResponseDto {
  @ApiProperty({ type: [CourseUserListItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CourseUserListItemDto)
  list: CourseUserListItemDto[];

  @ApiProperty({ description: '总数', example: 100 })
  @IsInt()
  total: number;
}

export class QueryLessonVideoLibraryDto {
  @ApiProperty({ description: '课程ID', example: 'course-uuid' })
  @IsString()
  @IsNotEmpty()
  course_id: string;

  @ApiPropertyOptional({ description: '页码', default: 1, example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: '每页条数', default: 10, example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 10;

  @ApiPropertyOptional({
    description: '文件名关键词（模糊匹配）',
    example: '第一章',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  filename?: string;
}

export class LessonVideoLibraryItemDto {
  @ApiProperty({ description: '文件名', example: '第一章导学.mp4' })
  fileName: string;

  @ApiProperty({ description: '文件ID（file_chunk.id）', example: 'uuid-v4' })
  fileId: string;

  @ApiProperty({ description: '文件Hash', example: 'abc123md5' })
  fileHash: string;

  @ApiProperty({
    description: '文件目录相对路径（不含文件名）',
    example: 'schools/school-uuid/resource_library/videos/ab/cd',
  })
  target_path: string;
}

export class LessonVideoLibraryResponseDto {
  @ApiProperty({ type: [LessonVideoLibraryItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LessonVideoLibraryItemDto)
  list: LessonVideoLibraryItemDto[];

  @ApiProperty({ description: '总数', example: 20 })
  @IsInt()
  total: number;
}

export class CourseOutlineLessonDto {
  @ApiProperty({ description: '课时ID', example: '301' })
  @IsString()
  @IsNotEmpty()
  lesson_id: string;

  @ApiProperty({ description: '课时标题', example: '1.1 Vite 核心原理解析' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({
    description: '课时描述',
    example: '本节课主要讲解 Vite 的双引擎架构...',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: '资源ID，可为空',
    example: 'res_88291',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  video_path?: string | null;

  @ApiProperty({ description: '排序值', example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sort_order: number;

  @ApiProperty({ description: '课时时长（秒）', example: 1250 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  duration: number;
}

export class CourseOutlineChapterDto {
  @ApiProperty({ description: '章节ID', example: '201' })
  @IsString()
  @IsNotEmpty()
  chapter_id: string;

  @ApiProperty({ description: '章节标题', example: '第一章：前端工程化基础' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiProperty({ description: '排序值', example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sort_order: number;

  @ApiProperty({ type: [CourseOutlineLessonDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CourseOutlineLessonDto)
  lessons: CourseOutlineLessonDto[];
}

export class CourseOutlineDraftDto {
  @ApiProperty({ description: '课程ID', example: '1001' })
  @IsString()
  @IsNotEmpty()
  course_id: string;

  @ApiProperty({ description: '学校ID', example: 'sch_001' })
  @IsString()
  @IsNotEmpty()
  school_id: string;

  @ApiProperty({
    description: '课程状态: 0-未发布, 1-已发布',
    enum: CourseStatusValues,
    example: CourseStatusMap.PUBLISHED,
  })
  @Type(() => Number)
  @IsInt()
  @IsIn(CourseStatusValues)
  status: number;

  @ApiProperty({ type: [CourseOutlineChapterDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CourseOutlineChapterDto)
  chapters: CourseOutlineChapterDto[];
}

export class SaveCourseDraftDto {
  @ApiProperty({ description: '课程ID', example: '1001' })
  @IsString()
  @IsNotEmpty()
  course_id: string;

  @ApiProperty({
    description: '课程大纲草稿 JSON',
    type: CourseOutlineDraftDto,
    example: {
      course_id: '1001',
      school_id: 'sch_001',
      status: 1,
      chapters: [
        {
          chapter_id: '201',
          title: '第一章：前端工程化基础',
          sort_order: 1,
          lessons: [
            {
              lesson_id: 'temp_uuid_a1b2',
              title: '1.2 React 19 新特性',
              description: '',
              sort_order: 2,
              video_path: null,
              duration: 0,
            },
          ],
        },
      ],
    },
  })
  @IsObject()
  @ValidateNested()
  @Type(() => CourseOutlineDraftDto)
  draft_content: CourseOutlineDraftDto;
}

export class PublishCourseOutlineDto extends SaveCourseDraftDto {}

export class ChapterQuickUpdateDto {
  @ApiProperty({ description: '章节ID', example: '201' })
  @IsString()
  @IsNotEmpty()
  chapter_id: string;

  @ApiProperty({
    description: '章节标题',
    example: '第一章：前端工程化基础（修订）',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;
}

export class QuickUpdateChapterTitleDto extends SaveCourseDraftDto {
  @ApiProperty({ type: ChapterQuickUpdateDto })
  @ValidateNested()
  @Type(() => ChapterQuickUpdateDto)
  chapter: ChapterQuickUpdateDto;
}

export class LessonQuickUpdateDto {
  @ApiProperty({ description: '课时ID', example: '301' })
  @IsString()
  @IsNotEmpty()
  lesson_id: string;

  @ApiProperty({ description: '章节ID', example: '201' })
  @IsString()
  @IsNotEmpty()
  chapter_id: string;

  @ApiProperty({
    description: '课时标题',
    example: '1.1 Vite 核心原理解析（修订）',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({
    description: '课时描述',
    example: '深入讲解 Vite 的双引擎机制',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: '资源ID，可为空',
    example: 'res_99302',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  video_path?: string | null;

  @ApiProperty({ description: '课时时长（秒）', example: 3400 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  duration: number;

  @ApiProperty({ description: '排序值', example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sort_order: number;
}

export class QuickUpdateLessonDto extends SaveCourseDraftDto {
  @ApiProperty({ type: LessonQuickUpdateDto })
  @ValidateNested()
  @Type(() => LessonQuickUpdateDto)
  lesson: LessonQuickUpdateDto;
}

export class CourseBasicResponseDto {
  @ApiProperty({ description: '课程ID' })
  id: string;

  @ApiProperty({ description: '学校ID' })
  school_id: string;

  @ApiProperty({ description: '学校名称', example: '第一中学' })
  school_name: string;

  @ApiProperty({ description: '创建人ID' })
  creator_id: string;

  @ApiPropertyOptional({ description: '创建者姓名', example: '王老师' })
  creator_name?: string;

  @ApiProperty({ description: '课程名称' })
  name: string;

  @ApiPropertyOptional({ description: '封面图' })
  cover_img?: string;

  @ApiProperty({
    description: '课程状态: 0-未发布, 1-已发布',
    enum: CourseStatusValues,
  })
  status: number;

  @ApiPropertyOptional({ description: '创建时间戳(s)' })
  create_time?: string;

  @ApiPropertyOptional({ description: '更新时间戳(s)' })
  update_time?: string;

  @ApiProperty({
    description: '任课老师列表',
    type: [TeacherSimpleDto],
  })
  @IsArray()
  teacher_names: TeacherSimpleDto[];
}

export class CreateCourseResponseDto {
  @ApiProperty({ description: '课程ID' })
  course_id: string;
}

export class SaveCourseDraftResponseDto {
  @ApiProperty({ description: '课程ID', example: '1001' })
  course_id: string;

  @ApiProperty({ description: '是否更新成功', example: true })
  updated: true;
}

export class PublishIdMappingItemDto {
  @ApiProperty({ description: '临时ID', example: 'temp_uuid_a1b2' })
  temp_id: string;

  @ApiProperty({ description: '真实ID', example: '301' })
  real_id: string;
}

export class PublishIdMappingsDto {
  @ApiProperty({ type: [PublishIdMappingItemDto] })
  chapters: PublishIdMappingItemDto[];

  @ApiProperty({ type: [PublishIdMappingItemDto] })
  lessons: PublishIdMappingItemDto[];
}

export class PublishCourseOutlineResponseDto {
  @ApiProperty({ description: '课程ID', example: '1001' })
  course_id: string;

  @ApiProperty({ description: '是否发布成功', example: true })
  published: true;

  @ApiProperty({ description: '章节数量', example: 2 })
  chapter_count: number;

  @ApiProperty({ description: '课时数量', example: 3 })
  lesson_count: number;

  @ApiProperty({ type: PublishIdMappingsDto })
  id_mappings: PublishIdMappingsDto;
}

export class QuickUpdateChapterTitleResponseDto {
  @ApiProperty({ description: '课程ID', example: '1001' })
  course_id: string;

  @ApiProperty({ description: '章节ID', example: '201' })
  chapter_id: string;

  @ApiProperty({ description: '是否更新成功', example: true })
  updated: true;
}

export class QuickUpdateLessonResponseDto {
  @ApiProperty({ description: '课程ID', example: '1001' })
  course_id: string;

  @ApiProperty({ description: '课时ID', example: '301' })
  lesson_id: string;

  @ApiProperty({ description: '是否更新成功', example: true })
  updated: true;
}

export class UpdateCourseResponseDto {
  @ApiProperty({ description: '课程ID' })
  id: string;

  @ApiProperty({ description: '是否更新成功', example: true })
  updated: boolean;
}

export class DeleteCourseResponseDto {
  @ApiProperty({ description: '课程ID' })
  id: string;

  @ApiProperty({ description: '是否删除成功', example: true })
  deleted: boolean;

  @ApiProperty({
    description: '删除模式',
    enum: ['hard', 'soft'],
    example: 'hard',
  })
  mode: 'hard' | 'soft';
}
