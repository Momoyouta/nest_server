export enum TeacherCourseProgressSortByMap {
  progressPercent = 'progressPercent',
  studentName = 'studentName',
}

export enum TeacherCourseProgressSortOrderMap {
  ASC = 'ASC',
  DESC = 'DESC',
}

export enum TeacherCourseProgressCompletedOnlyMap {
  all = 0,
  completed = 1,
}

export const TeacherCourseProgressSortColumnMap: Record<
  TeacherCourseProgressSortByMap,
  string
> = {
  [TeacherCourseProgressSortByMap.progressPercent]: 'COALESCE(cs.progress_percent, 0)',
  [TeacherCourseProgressSortByMap.studentName]: 'COALESCE(user.name, "")',
};
