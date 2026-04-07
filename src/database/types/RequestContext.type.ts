export interface RequestContext {
  index?: number;
  requestId?: string;
  userId?: string;
  platform?: 'admin' | 'user';
  roleIds?: string[];
  schoolId?: string;
  actorType?: number;
  actorId?: string;
}
