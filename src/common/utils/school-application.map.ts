export const SchoolApplicationStatusMap = {
  PENDING: 0,
  APPROVED: 1,
  REJECTED: 2,
};

export const SchoolApplicationStatusValues = Object.values(SchoolApplicationStatusMap);

export const SchoolApplicationReviewActionMap = {
  APPROVE: 'approve',
  REJECT: 'reject',
} as const;

export const SchoolApplicationReviewActionValues = Object.values(
  SchoolApplicationReviewActionMap,
);
