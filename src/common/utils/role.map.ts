export const AdminRolesMap = {
  root: '0', // 平台超级管理员
  admin: '1', // 平台普通管理员
  school_admin: '5', // 学校普通管理员
  school_root: '6', //学校超级管理员
  teacher: '3',
  student: '4'
};

export const PlatformAdmin = [AdminRolesMap.root, AdminRolesMap.admin];
export const SchoolAdmin = [AdminRolesMap.school_root, AdminRolesMap.school_admin];

export const AdminRoleValues = Object.values(AdminRolesMap);
