export enum TeacherQuestionMetricSortByMap {
  questionNo = 'questionNo',
  rate = 'rate',
}

export enum TeacherQuestionMetricSortOrderMap {
  ASC = 'ASC',
  DESC = 'DESC',
}

export const TeacherQuestionMetricSortColumnMap: Record<
  TeacherQuestionMetricSortByMap,
  string
> = {
  [TeacherQuestionMetricSortByMap.questionNo]: 'questionNo',
  [TeacherQuestionMetricSortByMap.rate]: 'metricRate',
};
