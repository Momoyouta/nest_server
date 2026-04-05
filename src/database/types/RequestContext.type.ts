export interface RequestContext {
  index?: number;
  requestId?: string;
  userId?: string;
  platform?: 'admin' | 'user';
  roleIds?: string[];
}
