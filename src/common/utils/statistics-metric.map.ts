export type StatisticsScope = 'platform' | 'school' | 'teacher' | 'student';

export interface StatisticsMetricDefinition {
  code: string;
  name: string;
  unit: string;
  scopes: StatisticsScope[];
}

export const StatisticsMetricMap: StatisticsMetricDefinition[] = [
  {
    code: 'platform.schoolFunnel.totalApply',
    name: '入驻申请总数',
    unit: 'count',
    scopes: ['platform'],
  },
  {
    code: 'platform.schoolFunnel.approved',
    name: '审核通过数',
    unit: 'count',
    scopes: ['platform'],
  },
  {
    code: 'platform.schoolFunnel.rejected',
    name: '审核驳回数',
    unit: 'count',
    scopes: ['platform'],
  },
  {
    code: 'platform.userTotal.total',
    name: '平台注册用户总数',
    unit: 'count',
    scopes: ['platform'],
  },
  {
    code: 'platform.storageUsage.videoRatio',
    name: '视频存储占比',
    unit: 'ratio',
    scopes: ['platform'],
  },
  {
    code: 'platform.courseSummary.publishedRatio',
    name: '课程发布率',
    unit: 'ratio',
    scopes: ['platform'],
  },
  {
    code: 'school.peopleSummary.activeTeachers',
    name: '本校激活教师数',
    unit: 'count',
    scopes: ['school'],
  },
  {
    code: 'school.peopleSummary.activeStudents',
    name: '本校激活学生数',
    unit: 'count',
    scopes: ['school'],
  },
  {
    code: 'school.learningSummary.avgProgressPercent',
    name: '平均课程进度',
    unit: 'percent',
    scopes: ['school'],
  },
  {
    code: 'teacher.todo.pendingReviewCount',
    name: '待批改数量',
    unit: 'count',
    scopes: ['teacher'],
  },
  {
    code: 'teacher.questionAccuracy.correctRate',
    name: '单题正确率',
    unit: 'ratio',
    scopes: ['teacher'],
  },
  {
    code: 'student.myCourses.progressPercent',
    name: '课程进度',
    unit: 'percent',
    scopes: ['student'],
  },
  {
    code: 'student.todoAssignments.remainSeconds',
    name: '作业剩余时间',
    unit: 'seconds',
    scopes: ['student'],
  },
];

export const StatisticsScopes: StatisticsScope[] = [
  'platform',
  'school',
  'teacher',
  'student',
];
