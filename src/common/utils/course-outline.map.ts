export const CourseOutlineSourceMap = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
} as const;

export const CourseOutlineSourceValues = Object.values(CourseOutlineSourceMap);

export type CourseOutlineSource =
  (typeof CourseOutlineSourceMap)[keyof typeof CourseOutlineSourceMap];
