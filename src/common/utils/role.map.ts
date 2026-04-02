export const AdminRolesMap = {
  root: '0', // 平台超级管理员
  admin: '1', // 平台普通管理员
  school_admin: '5', // 学校普通管理员
  school_root: '6', //学校超级管理员
  teacher: '4',
  student: '3',
};

export const PlatformAdminRoles = [AdminRolesMap.root, AdminRolesMap.admin];
export const SchoolAdminRoles = [
  AdminRolesMap.school_root,
  AdminRolesMap.school_admin,
];
export const AdminRoles = [
  AdminRolesMap.school_root,
  AdminRolesMap.school_admin,
  AdminRolesMap.root,
  AdminRolesMap.admin,
];

export const AdminRoleValues = Object.values(AdminRolesMap);
