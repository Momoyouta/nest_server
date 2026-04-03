export const InvitationTypeMap = {
  TEACHER_JOIN_SCHOOL: 0,
  STUDENT_JOIN_SCHOOL: 1,
  STUDENT_JOIN_COURSE: 2,
} as const;

export const InvitationTypeValues = Object.values(InvitationTypeMap);
