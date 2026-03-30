/**
 * 课程状态编码映射
 * 来源: course.status COMMENT '状态: 0-未发布, 1-已发布'
 */
export const CourseStatusMap = {
  UNPUBLISHED: 0,
  PUBLISHED: 1,
} as const;

export const CourseStatusValues = Object.values(CourseStatusMap);

/**
 * 作业状态编码映射
 * 来源: course_assignment.status COMMENT '状态: 0-草稿, 1-已发布'
 */
export const CourseAssignmentStatusMap = {
  DRAFT: 0,
  PUBLISHED: 1,
} as const;

export const CourseAssignmentStatusValues = Object.values(CourseAssignmentStatusMap);

/**
 * 提交状态编码映射
 * 来源: assignment_submission.status COMMENT
 * '状态: 0-未提交, 1-已提交(待批改), 2-已批改'
 */
export const AssignmentSubmissionStatusMap = {
  NOT_SUBMITTED: 0,
  SUBMITTED_PENDING_REVIEW: 1,
  REVIEWED: 2,
} as const;

export const AssignmentSubmissionStatusValues = Object.values(AssignmentSubmissionStatusMap);

/**
 * 题型编码映射
 * 来源: course_assignment_question.type COMMENT
 * '题型: 1-单选, 2-多选, 3-填空(客观题自动判分), 4-简答(主观题人工判分)'
 */
export const CourseAssignmentQuestionTypeMap = {
  SINGLE_CHOICE: 1,
  MULTIPLE_CHOICE: 2,
  FILL_IN_THE_BLANK: 3,
  SHORT_ANSWER: 4,
} as const;

export const CourseAssignmentQuestionTypeValues = Object.values(CourseAssignmentQuestionTypeMap);

/**
 * tinyint(1) 二值标记
 * 适用字段:
 * 1) assignment_answer_detail.is_correct COMMENT '客观题自动判分结果: 1-对, 0-错'
 * 2) course_learning_record.is_completed COMMENT '是否已学完 (1-是, 0-否)'
 */
export const BinaryFlagMap = {
  NO: 0,
  YES: 1,
} as const;

export const BinaryFlagValues = Object.values(BinaryFlagMap);
