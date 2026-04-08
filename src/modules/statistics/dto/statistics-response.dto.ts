import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SchoolFunnelDto {
  @ApiProperty({ description: '申请总数', example: 120 })
  totalApply: number;

  @ApiProperty({ description: '审核通过数', example: 80 })
  approved: number;

  @ApiProperty({ description: '审核驳回数', example: 40 })
  rejected: number;
}

export class PlatformUserTotalDto {
  @ApiProperty({ description: '用户总数', example: 5000 })
  total: number;

  @ApiProperty({ description: '教师总数', example: 800 })
  teacherTotal: number;

  @ApiProperty({ description: '学生总数', example: 4200 })
  studentTotal: number;
}

export class StorageUsageDto {
  @ApiProperty({ description: '总存储字节数', example: 1024000000 })
  totalBytes: number;

  @ApiProperty({ description: '视频存储字节数', example: 800000000 })
  videoBytes: number;

  @ApiProperty({ description: '普通文件存储字节数', example: 224000000 })
  normalBytes: number;

  @ApiProperty({ description: '视频存储占比', example: 0.7812 })
  videoRatio: number;
}

export class CourseSummaryDto {
  @ApiProperty({ description: '课程总数', example: 500 })
  totalCourses: number;

  @ApiProperty({ description: '已发布课程数', example: 300 })
  publishedCourses: number;

  @ApiProperty({ description: '发布占比', example: 0.6 })
  publishedRatio: number;
}

export class PlatformOverviewDto {
  @ApiProperty({ description: '学校入驻漏斗', type: SchoolFunnelDto })
  schoolFunnel: SchoolFunnelDto;

  @ApiProperty({ description: '已入驻学校总数', example: 120 })
  schoolTotal: number;

  @ApiProperty({ description: '平台用户规模', type: PlatformUserTotalDto })
  userTotal: PlatformUserTotalDto;

  @ApiProperty({ description: '存储使用情况', type: StorageUsageDto })
  storageUsage: StorageUsageDto;

  @ApiProperty({ description: '课程概览', type: CourseSummaryDto })
  courseSummary: CourseSummaryDto;
}

export class PlatformSchoolTotalDto {
  @ApiProperty({ description: '已入驻学校总数', example: 120 })
  schoolTotal: number;
}

export class CollegeDistributionItemDto {
  @ApiProperty({ description: '学院名称', example: '计算机学院' })
  college: string;

  @ApiProperty({ description: '教师数', example: 120 })
  teacherCount: number;

  @ApiProperty({ description: '学生数', example: 980 })
  studentCount: number;
}

export class PeopleSummaryDto {
  @ApiProperty({ description: '激活教师数', example: 200 })
  activeTeachers: number;

  @ApiProperty({ description: '激活学生数', example: 3200 })
  activeStudents: number;

  @ApiProperty({ description: '学院分布', type: [CollegeDistributionItemDto] })
  collegeDistribution: CollegeDistributionItemDto[];
}

export class AssetSummaryDto {
  @ApiProperty({ description: '教学资料库数量', example: 560 })
  materialLibraryCount: number;

  @ApiProperty({ description: '活跃教学组数量', example: 130 })
  activeTeachingGroups: number;
}

export class LearningSummaryDto {
  @ApiProperty({ description: '平均课程进度(%)', example: 68.5 })
  avgProgressPercent: number;

  @ApiProperty({ description: '作业提交率', example: 0.83 })
  assignmentSubmitRate: number;

  @ApiProperty({ description: '平均得分率(按100分换算)', example: 0.76 })
  avgScoreRate: number;
}

export class SchoolOverviewDto {
  @ApiProperty({ description: '人员概览', type: PeopleSummaryDto })
  peopleSummary: PeopleSummaryDto;

  @ApiProperty({ description: '课程概览', type: CourseSummaryDto })
  courseSummary: CourseSummaryDto;

  @ApiProperty({ description: '教学资产概览', type: AssetSummaryDto })
  assetSummary: AssetSummaryDto;

  @ApiProperty({ description: '学情概览', type: LearningSummaryDto })
  learningSummary: LearningSummaryDto;
}

export class TeacherTodoDto {
  @ApiProperty({ description: '待批改数量', example: 58 })
  pendingReviewCount: number;
}

export class LessonFunnelItemDto {
  @ApiProperty({ description: '课时ID', example: 'lesson_uuid' })
  lessonId: string;

  @ApiProperty({ description: '课时名称', example: '第一章-导论' })
  lessonName: string;

  @ApiProperty({ description: '平均观看进度(%)', example: 72.3 })
  avgProgressPercent: number;

  @ApiProperty({ description: '学习次数', example: 214 })
  learnCount: number;
}

export class ScoreBucketItemDto {
  @ApiProperty({ description: '分数桶key', example: 'excellent' })
  key: string;

  @ApiProperty({ description: '分数段标签', example: '90-100' })
  label: string;

  @ApiProperty({ description: '人数', example: 20 })
  count: number;
}

export class ScoreDistributionDto {
  @ApiProperty({ description: '平均分', example: 76.5 })
  avgScore: number;

  @ApiProperty({ description: '最高分', example: 99 })
  maxScore: number;

  @ApiProperty({ description: '最低分', example: 45 })
  minScore: number;

  @ApiProperty({ description: '分数段分布', type: [ScoreBucketItemDto] })
  buckets: ScoreBucketItemDto[];
}

export class QuestionAccuracyItemDto {
  @ApiProperty({ description: '题目ID', example: 'question_uuid' })
  questionId: string;

  @ApiProperty({ description: '题号', example: 3 })
  questionNo: number;

  @ApiProperty({ description: '正确率', example: 0.62 })
  correctRate: number;
}

export class TeacherObjectiveQuestionAccuracyItemDto {
  @ApiProperty({ description: '题号', example: 3 })
  questionNo: number;

  @ApiProperty({ description: '正确率', example: 0.62 })
  correctRate: number;
}

export class TeacherFillQuestionScoreRateItemDto {
  @ApiProperty({ description: '题号', example: 6 })
  questionNo: number;

  @ApiProperty({ description: '得分率', example: 0.75 })
  scoreRate: number;
}

export class TeacherShortAnswerQuestionScoreRateItemDto {
  @ApiProperty({ description: '题号', example: 9 })
  questionNo: number;

  @ApiProperty({ description: '得分率', example: 0.68 })
  scoreRate: number;
}

export class TeacherObjectiveQuestionAccuracyPageDto {
  @ApiProperty({ description: '当前页码', example: 1 })
  page: number;

  @ApiProperty({ description: '每页条数', example: 10 })
  pageSize: number;

  @ApiProperty({ description: '总条数', example: 45 })
  total: number;

  @ApiProperty({ description: '列表数据', type: [TeacherObjectiveQuestionAccuracyItemDto] })
  list: TeacherObjectiveQuestionAccuracyItemDto[];
}

export class TeacherFillQuestionScoreRatePageDto {
  @ApiProperty({ description: '当前页码', example: 1 })
  page: number;

  @ApiProperty({ description: '每页条数', example: 10 })
  pageSize: number;

  @ApiProperty({ description: '总条数', example: 25 })
  total: number;

  @ApiProperty({ description: '列表数据', type: [TeacherFillQuestionScoreRateItemDto] })
  list: TeacherFillQuestionScoreRateItemDto[];
}

export class TeacherShortAnswerQuestionScoreRatePageDto {
  @ApiProperty({ description: '当前页码', example: 1 })
  page: number;

  @ApiProperty({ description: '每页条数', example: 10 })
  pageSize: number;

  @ApiProperty({ description: '总条数', example: 20 })
  total: number;

  @ApiProperty({
    description: '列表数据',
    type: [TeacherShortAnswerQuestionScoreRateItemDto],
  })
  list: TeacherShortAnswerQuestionScoreRateItemDto[];
}

export class SubmissionStudentItemDto {
  @ApiProperty({ description: '学生ID', example: 'student_uuid' })
  studentId: string;

  @ApiProperty({ description: '学生姓名', example: '张三' })
  studentName: string;
}

export class SubmissionStatusDto {
  @ApiProperty({ description: '未提交列表', type: [SubmissionStudentItemDto] })
  unsubmitted: SubmissionStudentItemDto[];

  @ApiProperty({
    description: '已提交待批改列表',
    type: [SubmissionStudentItemDto],
  })
  submittedPendingReview: SubmissionStudentItemDto[];

  @ApiProperty({ description: '已批改列表', type: [SubmissionStudentItemDto] })
  reviewed: SubmissionStudentItemDto[];
}

export class TeacherDashboardDto {
  @ApiProperty({ description: '待办概览', type: TeacherTodoDto })
  todo: TeacherTodoDto;

  @ApiProperty({ description: '课时漏斗', type: [LessonFunnelItemDto] })
  lessonFunnel: LessonFunnelItemDto[];

  @ApiProperty({ description: '成绩分布', type: ScoreDistributionDto })
  scoreDistribution: ScoreDistributionDto;

  @ApiProperty({ description: '单题正确率', type: [QuestionAccuracyItemDto] })
  questionAccuracy: QuestionAccuracyItemDto[];

  @ApiProperty({ description: '提交状态追踪', type: SubmissionStatusDto })
  submissionStatus: SubmissionStatusDto;
}

export class TeacherCourseGroupProgressItemDto {
  @ApiProperty({ description: '学生ID', example: 'student_uuid' })
  studentId: string;

  @ApiProperty({ description: '学生姓名', example: '张三' })
  studentName: string;

  @ApiProperty({ description: '头像路径', example: '/upload/avatar/xx.png' })
  avatarPath: string;

  @ApiProperty({ description: '课程进度(%)', example: 100 })
  progressPercent: number;
}

export class TeacherCourseGroupProgressDto {
  @ApiProperty({ description: '当前页码', example: 1 })
  page: number;

  @ApiProperty({ description: '每页条数', example: 10 })
  pageSize: number;

  @ApiProperty({ description: '当前筛选后的总条数', example: 48 })
  total: number;

  @ApiProperty({ description: '教学组总人数', example: 60 })
  totalStudents: number;

  @ApiProperty({ description: '100%进度人数', example: 22 })
  completedStudents: number;

  @ApiProperty({ description: '学生进度列表', type: [TeacherCourseGroupProgressItemDto] })
  list: TeacherCourseGroupProgressItemDto[];
}

export class StudentCourseProgressItemDto {
  @ApiProperty({ description: '课程ID', example: 'course_uuid' })
  courseId: string;

  @ApiProperty({ description: '课程名称', example: '数据库系统' })
  courseName: string;

  @ApiProperty({ description: '课程进度(%)', example: 45 })
  progressPercent: number;
}

export class ContinueLearningDto {
  @ApiProperty({ description: '所属课程名称', example: '数据库系统' })
  courseName: string;

  @ApiProperty({ description: '课时ID', example: 'lesson_uuid' })
  lessonId: string;

  @ApiProperty({ description: '课时名称', example: '索引优化' })
  lessonName: string;

  @ApiProperty({ description: '最后学习时间戳(s)', example: '1714521600' })
  lastLearnTime: string;
}

export class TodoAssignmentItemDto {
  @ApiProperty({ description: '作业ID', example: 'assignment_uuid' })
  assignmentId: string;

  @ApiProperty({ description: '所属课程名称', example: '数据库系统' })
  courseName: string;

  @ApiProperty({ description: '作业标题', example: '第一章测验' })
  title: string;

  @ApiPropertyOptional({ description: '截止时间戳(s)', example: '1715000000' })
  deadline?: string;

  @ApiProperty({ description: '距离截止剩余秒数', example: 3600 })
  remainSeconds: number;
}

export class GradeHistoryItemDto {
  @ApiProperty({ description: '作业ID', example: 'assignment_uuid' })
  assignmentId: string;

  @ApiProperty({ description: '作业标题', example: '第二章作业' })
  title: string;

  @ApiProperty({ description: '总得分', example: 92.5 })
  totalScore: number;

  @ApiPropertyOptional({ description: '教师评语', example: '思路清晰' })
  teacherComment?: string;
}

export class StudentCourseGroupLearningSummaryDto {
  @ApiProperty({ description: '课程ID', example: 'course_uuid' })
  courseId: string;

  @ApiProperty({ description: '教学组ID', example: 'group_uuid' })
  teachingGroupId: string;

  @ApiProperty({ description: '作业平均分', example: 85.5 })
  assignmentAvgScore: number;

  @ApiProperty({ description: '教学组平均分排名', example: 3 })
  avgScoreRank: number;

  @ApiProperty({ description: '课程学习次数（课时观看次数）', example: 128 })
  courseLearnCount: number;
}

export class StudentLearningCenterDto {
  @ApiProperty({ description: '我的课程', type: [StudentCourseProgressItemDto] })
  myCourses: StudentCourseProgressItemDto[];

  @ApiPropertyOptional({
    description: '继续学习记录',
    type: ContinueLearningDto,
    nullable: true,
  })
  continueLearning: ContinueLearningDto | null;

  @ApiProperty({ description: '待办作业', type: [TodoAssignmentItemDto] })
  todoAssignments: TodoAssignmentItemDto[];

  @ApiProperty({ description: '成绩单', type: [GradeHistoryItemDto] })
  gradeHistory: GradeHistoryItemDto[];
}

export class StatisticsMetricDefinitionDto {
  @ApiProperty({ description: '指标编码', example: 'teacher.todo.pendingReviewCount' })
  code: string;

  @ApiProperty({ description: '指标名称', example: '待批改数量' })
  name: string;

  @ApiProperty({ description: '单位', example: 'count' })
  unit: string;

  @ApiProperty({ description: '适用范围', type: [String], example: ['teacher'] })
  scopes: string[];
}

export class TimeGranularityItemDto {
  @ApiProperty({ description: '粒度标识', example: 'day' })
  key: string;

  @ApiProperty({ description: '粒度名称', example: '按天' })
  label: string;
}

export class StatisticsDictionaryDto {
  @ApiProperty({ description: '指标定义', type: [StatisticsMetricDefinitionDto] })
  metricDefinitions: StatisticsMetricDefinitionDto[];

  @ApiProperty({ description: '分数段', type: [ScoreBucketItemDto] })
  scoreBuckets: ScoreBucketItemDto[];

  @ApiProperty({ description: '时间粒度选项', type: [TimeGranularityItemDto] })
  timeGranularity: TimeGranularityItemDto[];
}
