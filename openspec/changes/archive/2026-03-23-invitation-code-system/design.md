# 设计：邀请码系统

## 概述
本设计概述了用于教师和学生入驻的邀请码系统的技术实现。

## 架构

### 1. 数据传输对象 (DTO)
将在 `src/common/dto/invite.dto.ts` 中创建一个新的 DTO，以表示邀请码中存储的负载。
```typescript
export class InvitationDataDto {
  type: number; // 0:老师加入学校 1:学生加入学校 2:学生加入课程
  school_id: string;
  grade: string; // 入学年份
  class_id?: string; // 教师可选
  creater_id: string;
  create_time: string; // 时间戳 (s)
  ttl?: number; // 时限 (s)
}
```

### 2. 邀请码模块 (Invitation Module)
该模块将处理邀请码的完整生命周期。
- **创建**: `POST /admin/invite` (由管理员调用)。
- **删除**: `DELETE /admin/invite/:code`。
- **查询**: `GET /admin/invite` (支持分页和过滤)。

#### 数据库实体 (InvitationCode Entity)
```typescript
@Entity('invitation_code')
export class InvitationCode {
  @PrimaryColumn() code: string;
  @Column() type: number;
  @Column() school_id: string;
  @Column() grade: string;
  @Column() class_id: string;
  @Column() creater_id: string;
  @Column() create_time: string;
  @Column({ nullable: true }) ttl: string;
  @Column() update_time: string;
  @Column() ttl: number;
}
```

#### 查询逻辑
使用 `createQueryBuilder` 关联 `school` 和 `user` 表以获取 `school_name` 和 `creator_name`。

### 3. 认证模块 (注册)
注册逻辑将更新以处理邀请码。
- **端点**: `POST /auth/register`
- **逻辑**:
  1. 接收 `username`、`password` 和 `inviteCode`。
  2. 如果提供了 `inviteCode`:
     a. 从数据库中查询 `InvitationCode`。
     b. 如果不存在，则返回错误。
     c. 根据 `type`:
        - `type === 0`: 调用 `UserService.createTeacherWithUser(registerDto, inviteData.school_id)`。
        - `type === 1`: 调用 `UserService.createStudentWithUser(registerDto, inviteData.school_id, inviteData.grade, inviteData.class_id)`。
        - `type === 2`: (未来范围)

### 4. 用户模块扩展
`UserService` 将增强，以处理双实体创建（User + Teacher/Student）。
- **createTeacherWithUser**:
  - 创建 `User` 实体（角色设为教师）。
  - 创建链接到 `User.id` 和 `inviteData.school_id` 的 `Teacher` 实体。
- **createStudentWithUser**:
  - 创建 `User` 实体（角色设为学生）。
  - 创建链接到 `User.id`、`inviteData.school_id`、`inviteData.grade` 和 `inviteData.class_id` 的 `Student` 实体。

## 数据库变更
新增 `invitation_code` 表，包含其元数据字段。使用 `TypeORM` 自动同步或手动 SQL 创建。

## 安全性
- `POST /admin-auth/invite` 端点必须受 `@AdminAuth()` 和权限控制保护。
- 如果未指定，邀请码应具有默认 TTL（例如 7 天）。
