export const AdminRolesMap = {
  root: '0',
  admin: '1',
  school_admin: '5',
  school_root: '6',
  teacher: '3',
  student: '4'
};

export const PlatformAdmin = [AdminRolesMap.root, AdminRolesMap.admin];
export const SchoolAdmin = [AdminRolesMap.school_root, AdminRolesMap.school_admin];

export const AdminRoleValues = Object.values(AdminRolesMap);
