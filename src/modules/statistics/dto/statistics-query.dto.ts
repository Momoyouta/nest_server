import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { StatisticsScope, StatisticsScopes } from '@/common/utils/statistics-metric.map';
import {
  TeacherCourseProgressCompletedOnlyMap,
  TeacherCourseProgressSortByMap,
  TeacherCourseProgressSortOrderMap,
} from '@/common/utils/teacher-course-progress.map';
import {
  TeacherQuestionMetricSortByMap,
  TeacherQuestionMetricSortOrderMap,
} from '@/common/utils/teacher-question-statistics.map';

export class StatisticsTimeRangeQueryDto {
  @ApiPropertyOptional({ description: '起始时间戳(s)', example: '1711929600' })
  @IsOptional()
  @IsNumberString()
  startTime?: string;

  @ApiPropertyOptional({ description: '结束时间戳(s)', example: '1714521600' })
  @IsOptional()
  @IsNumberString()
  endTime?: string;
}

export class PlatformOverviewQueryDto extends StatisticsTimeRangeQueryDto {}

export class SchoolOverviewQueryDto extends StatisticsTimeRangeQueryDto {
  @ApiPropertyOptional({ description: '学校ID，平台管理员可指定', example: 'school_uuid' })
  @IsOptional()
  @IsString()
  schoolId?: string;
}

export class GradeStatisticsQueryDto extends SchoolOverviewQueryDto {
  @ApiProperty({ description: '年级', example: '2023' })
  @IsString({ message: 'grade 必须为字符串' })
  @IsNotEmpty({ message: 'grade 不能为空' })
  grade: string;

  @ApiPropertyOptional({ description: '学院ID', example: 'college_uuid' })
  @IsOptional()
  @IsString()
  collegeId?: string;
}

export class TeacherDashboardQueryDto extends StatisticsTimeRangeQueryDto {
  @ApiPropertyOptional({ description: '课程ID', example: 'course_uuid' })
  @IsOptional()
  @IsString()
  courseId?: string;

  @ApiPropertyOptional({ description: '教学组ID', example: 'group_uuid' })
  @IsOptional()
  @IsString()
  teachingGroupId?: string;

  @ApiPropertyOptional({ description: '作业ID', example: 'assignment_uuid' })
  @IsOptional()
  @IsString()
  assignmentId?: string;
}

export class TeacherCourseGroupProgressQueryDto extends StatisticsTimeRangeQueryDto {
  @ApiProperty({ description: '课程ID', example: 'course_uuid' })
  @IsString({ message: 'courseId 必须为字符串' })
  @IsNotEmpty({ message: 'courseId 不能为空' })
  courseId: string;

  @ApiProperty({ description: '教学组ID', example: 'group_uuid' })
  @IsString({ message: 'teachingGroupId 必须为字符串' })
  @IsNotEmpty({ message: 'teachingGroupId 不能为空' })
  teachingGroupId: string;

  @ApiPropertyOptional({ description: '页码', default: 1, example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'page 必须为整数' })
  @Min(1, { message: 'page 不能小于 1' })
  page?: number = 1;

  @ApiPropertyOptional({ description: '每页条数', default: 10, example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'pageSize 必须为整数' })
  @Min(1, { message: 'pageSize 不能小于 1' })
  @Max(100, { message: 'pageSize 不能大于 100' })
  pageSize?: number = 10;

  @ApiPropertyOptional({
    description: '排序字段',
    enum: TeacherCourseProgressSortByMap,
    default: TeacherCourseProgressSortByMap.progressPercent,
  })
  @IsOptional()
  @IsEnum(TeacherCourseProgressSortByMap, { message: 'sortBy 非法' })
  sortBy?: TeacherCourseProgressSortByMap =
    TeacherCourseProgressSortByMap.progressPercent;

  @ApiPropertyOptional({
    description: '排序方向',
    enum: TeacherCourseProgressSortOrderMap,
    default: TeacherCourseProgressSortOrderMap.DESC,
  })
  @IsOptional()
  @IsEnum(TeacherCourseProgressSortOrderMap, { message: 'sortOrder 非法' })
  sortOrder?: TeacherCourseProgressSortOrderMap =
    TeacherCourseProgressSortOrderMap.DESC;

  @ApiPropertyOptional({
    description: '100%进度筛选（0=全部，1=仅100%）',
    enum: TeacherCourseProgressCompletedOnlyMap,
    default: TeacherCourseProgressCompletedOnlyMap.all,
    example: TeacherCourseProgressCompletedOnlyMap.completed,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'completedOnly 必须为整数' })
  @IsIn(
    [
      TeacherCourseProgressCompletedOnlyMap.all,
      TeacherCourseProgressCompletedOnlyMap.completed,
    ],
    {
      message: 'completedOnly 仅支持 0 或 1',
    },
  )
  completedOnly?: TeacherCourseProgressCompletedOnlyMap =
    TeacherCourseProgressCompletedOnlyMap.all;
}

export class TeacherQuestionMetricQueryDto extends TeacherDashboardQueryDto {
  @ApiPropertyOptional({ description: '页码', default: 1, example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'page 必须为整数' })
  @Min(1, { message: 'page 不能小于 1' })
  page?: number = 1;

  @ApiPropertyOptional({ description: '每页条数', default: 10, example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'pageSize 必须为整数' })
  @Min(1, { message: 'pageSize 不能小于 1' })
  @Max(100, { message: 'pageSize 不能大于 100' })
  pageSize?: number = 10;

  @ApiPropertyOptional({
    description: '排序字段',
    enum: TeacherQuestionMetricSortByMap,
    default: TeacherQuestionMetricSortByMap.questionNo,
  })
  @IsOptional()
  @IsEnum(TeacherQuestionMetricSortByMap, { message: 'sortBy 非法' })
  sortBy?: TeacherQuestionMetricSortByMap =
    TeacherQuestionMetricSortByMap.questionNo;

  @ApiPropertyOptional({
    description: '排序方向',
    enum: TeacherQuestionMetricSortOrderMap,
    default: TeacherQuestionMetricSortOrderMap.ASC,
  })
  @IsOptional()
  @IsEnum(TeacherQuestionMetricSortOrderMap, { message: 'sortOrder 非法' })
  sortOrder?: TeacherQuestionMetricSortOrderMap =
    TeacherQuestionMetricSortOrderMap.ASC;
}

export class StudentLearningCenterQueryDto extends StatisticsTimeRangeQueryDto {
  @ApiPropertyOptional({ description: '课程ID', example: 'course_uuid' })
  @IsOptional()
  @IsString()
  courseId?: string;
}

export class StudentCourseGroupLearningSummaryQueryDto extends StatisticsTimeRangeQueryDto {
  @ApiProperty({ description: '课程ID', example: 'course_uuid' })
  @IsString({ message: 'courseId 必须为字符串' })
  @IsNotEmpty({ message: 'courseId 不能为空' })
  courseId: string;
}

export class StatisticsDictionaryQueryDto {
  @ApiPropertyOptional({
    description: '指标作用域',
    enum: StatisticsScopes,
    example: 'teacher',
  })
  @IsOptional()
  @IsIn(StatisticsScopes)
  scope?: StatisticsScope;
}
