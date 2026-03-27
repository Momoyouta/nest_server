## ADDED Requirements

### Requirement: 定时清理孤立分片
系统 SHALL 运行一个定时 Cron 任务（默认每天凌晨 2:00），扫描 MySQL `file_chunk` 表中 status 为 `pending` 且 `create_time` 早于当前时间 24 小时的记录。系统 SHALL 对每条过期记录：1) 删除磁盘上对应的分片目录（`uploads/temp/chunks/{fileHash}/`）；2) 将 DB 记录状态更新为 `expired`。任务 SHALL 记录清理日志（清理数量、耗时）。

**Cron 表达式：** `0 2 * * *`（可通过环境变量 `CHUNK_CLEANUP_CRON` 覆盖）
**超时阈值：** 默认 24 小时（可通过环境变量 `CHUNK_EXPIRE_HOURS` 覆盖，单位：小时）

#### Scenario: 清理过期分片
- **WHEN** 定时任务触发时，存在 2 条 create_time 超过 24h 的 pending 记录
- **THEN** 系统删除对应磁盘目录，将 2 条记录状态更新为 `expired`，日志记录"清理 2 条过期分片"

#### Scenario: 无过期分片时任务正常完成
- **WHEN** 定时任务触发时，无 pending 状态记录超过 24h
- **THEN** 任务正常完成，日志记录"无过期分片需清理"

#### Scenario: 磁盘目录不存在时不报错
- **WHEN** DB 中有过期记录，但对应磁盘目录已被手动删除
- **THEN** 系统忽略该文件系统错误，仍将 DB 记录更新为 `expired`，任务继续运行

### Requirement: 手动触发清理（管理端）
系统 SHALL 提供 POST `/file/chunk/cleanup` 管理接口，允许具有 admin 或 root 角色的用户手动触发一次清理任务。接口仅支持管理端 JWT。

**请求：**
- Method: `POST`
- Path: `/file/chunk/cleanup`
- Auth: Bearer 管理端 JWT（@Role('admin', 'root')）

**响应：**
```json
{
  "code": 200,
  "msg": "清理完成",
  "data": { "cleanedCount": 5, "durationMs": 230 }
}
```

#### Scenario: 管理员手动触发清理
- **WHEN** admin 角色用户调用 cleanup 接口
- **THEN** 系统执行同定时任务相同的清理逻辑，返回清理数量和耗时

#### Scenario: 非管理员被拒绝
- **WHEN** 普通用户（teacher/student）调用该接口
- **THEN** 返回 403，msg 为"无权访问"
