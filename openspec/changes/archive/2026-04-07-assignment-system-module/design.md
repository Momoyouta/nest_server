## Context

平台目前已具备课程、教学组、文件上传等基础能力，但缺少作业管理闭环。现有数据库中已有 `course_assignment`、`course_assignment_question`、`assignment_submission`、`assignment_answer_detail` 四张表的实体定义，但字段不完整（缺少 `start_time`、`teaching_group_id`、`analysis`、`teacher_comment` 等），且没有任何业务模块与 Controller 实现。本次需要在既有骨架上完整实现作业系统，包含教师端与学生端的全流程。

图片资源存储路径规范参考 README：题目图片存于 `fileStore/schools/{school_id}/courses/{course_id}/images/`，通过 `course_question_resource` 表关联到题目。

## Goals / Non-Goals

**Goals:**
- 基于现有框架规范（NestJS + TypeORM + class-validator + Swagger）实现完整作业模块。
- 教师能创建/保存草稿/发布作业，发布后题目与答案锁定。
- 支持五种题型（type: 1-单选, 2-多选, 3-判断, 4-填空, 5-简答），同类型题目可调整排序（`sort_order` 字段）。
- 支持按 `teaching_group_id`（教学小班）维度发布作业与统计。
- 学生端可保存草稿、最终提交；提交触发客观题（1/2/3 型）自动判分。
- 简答与填空题由教师手动批改打分并可留单题评语（`teacher_comment` 于 `assignment_answer_detail`）。
- 作答时间窗口（`start_time ~ deadline`）控制，截止后系统自动为未提交学生补零分记录。
- 题目配图轻量上传（非分片），记录到 `course_question_resource` 表。
- 教师查看全量统计：已批改数/已提交数/课程总人数、各题正确率/得分率。

**Non-Goals:**
- 不实现跨作业的题库复用。
- 不实现大文件分片上传（图片统一走单次上传接口）。
- 不实现防作弊监控功能。
- 不实现 AI 自动批改。

## Decisions

### 决策1：模块目录结构

**选择**：新建独立模块 `src/modules/assignment/`，内部分教师端 (`teacher/`) 与学生端 (`student/`) 两个子控制器，共用一个 `AssignmentService`。

**理由**：与现有 `src/modules/teacher/`、`src/modules/student/` 分离的架构一致；作业的"教师端 API"与"学生端 API"权限验证逻辑完全不同，分离更易维护。

**备选**：直接在 teacher/student 模块下分别添加 → 拒绝，会导致教师/学生模块过于臃肿，且作业业务本身复杂度足够单独成模块。

---

### 决策2：数据库实体变更策略

**选择**：在现有4个 Entity 类上**直接添加字段**（不新建表），并新增 `CourseQuestionResource` 实体（对应 `course_question_resource` 新表）。

变更汇总：

| 实体 | 新增字段 |
|------|---------|
| `CourseAssignment` | `start_time varchar(255)`, `teaching_group_id varchar(255)` |
| `CourseAssignmentQuestion` | `analysis json nullable` （题目解析）；同时更新 `type` 枚举 Map 新增 type=3 判断题（原 type 枚举缺少，需在 `course.map.ts` 中补充），题型重新梳理：1-单选，2-多选，3-判断，4-填空，5-简答 |
| `AssignmentSubmission` | `teaching_group_id varchar(255) nullable` |
| `AssignmentAnswerDetail` | `teacher_comment text nullable` |

**`course_question_resource` 新表**（对应新实体）：
```sql
CREATE TABLE `course_question_resource` (
  `id` varchar(255) NOT NULL,
  `question_id` varchar(255) NOT NULL COMMENT '关联的题目ID',
  `resource_type` tinyint DEFAULT 1 COMMENT '资源类型: 1-题干图片, 2-解析图片',
  `file_url` varchar(500) NOT NULL COMMENT '文件的相对路径',
  `create_time` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_question_id` (`question_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='题目多媒体资源关联表';
```

**理由**：TypeORM `synchronize: true`（开发环境）会自动 ADD COLUMN；新实体在 `common.module.ts` 的 entities 常量中统一注册，符合现有规范。

---

### 决策3：自动判分策略

**选择**：在学生提交（`/student/assignment/submit`）时，Service 层对每道客观题（type 1/2/3）进行自动判分：
- **单选 (1)** / **判断 (3)**：`student_answer.answer[0] === standard_answer.answer[0]` → 全对得满分。
- **多选 (2)**：`student_answer.answer` 排序后与 `standard_answer.answer` 排序后完全一致 → 得满分，否则0分（不支持部分得分）。
- **填空 (4) / 简答 (5)**：`is_correct = null`，`score = 0`，等待教师手动批改。

自动判分后立即更新 `assignment_answer_detail` 并累计更新 `assignment_submission.total_score`（仅含已自动判完的客观题分）。提交状态：若有主观题则设为 `status=1`（待批改），否则 `status=2`（已批改完成）。

**理由**：与参考设计保持一致；多选不支持部分得分符合现实中最严格的全对才给分模式，降低实现复杂度。

---

### 决策4：截止后自动补零分

**选择**：不使用定时任务，而是在教师查询统计接口（`/teacher/assignment/statistics`）时，**按需惰性检查**：若当前时间 > `deadline` 且有学生尚未提交，则为其在 `assignment_submission` 中生成 `status=0, total_score=0` 的记录。

同时提供 `POST /teacher/assignment/deadline/extend` 接口允许教师延长时间，作答窗口重新打开不影响已提交记录。

**理由**：使用定时任务对 Node.js 单进程服务有额外维护成本；惰性计算对该业务场景（统计时触发）已足够，且不存在实时性要求。

**备选**：`@nestjs/schedule` Cron Job → 拒绝，引入额外依赖且对该体量项目过重。

---

### 决策5：API 风格（全 POST）

**选择**：所有查询接口统一使用 `POST` 方法，查询参数通过 JSON Body 传递（如 `body.assignment_id`），符合用户设计参考中"不使用 GET 携带 ID"的要求。

路由规划：

| 方法 | 路径 | 角色 | 说明 |
|------|------|------|------|
| POST | /teacher/assignment/save | TEACHER | 创建/保存草稿 |
| POST | /teacher/assignment/publish | TEACHER | 发布作业 |
| POST | /teacher/assignment/list | TEACHER | 作业列表 |
| POST | /teacher/assignment/detail | TEACHER | 作业详情（含题目答案） |
| POST | /teacher/assignment/deadline/extend | TEACHER | 调整开始/截止时间 |
| POST | /teacher/assignment/statistics | TEACHER | 整体统计+各题分析 |
| POST | /teacher/assignment/grade | TEACHER | 手动批改主观题 |
| POST | /teacher/assignment/submissions | TEACHER | 查看所有学生提交列表 |
| POST | /student/assignment/list | STUDENT | 可做的作业列表 |
| POST | /student/assignment/detail | STUDENT | 作业题目详情（过滤答案） |
| POST | /student/assignment/draft/save | STUDENT | 保存作答草稿 |
| POST | /student/assignment/submit | STUDENT | 最终提交（触发自动判分） |
| POST | /student/assignment/result | STUDENT | 查看批改结果 |
| POST | /assignment/question/image/upload | TEACHER | 上传题目图片 |

---

### 决策6：图片上传

**选择**：复用现有 `FileService` 的单文件上传能力（非分片），将文件写入 `fileStore/schools/{school_id}/courses/{course_id}/images/`，返回相对路径后记录到 `course_question_resource`。

接口接收 `multipart/form-data`（`file` + `question_id` + `resource_type` + `course_id`），控制器标注 `@UseInterceptors(FileInterceptor('file'))`。

**理由**：题目图片体积一般 < 5MB，无需分片；路径规范已在 README 中定义。

---

### 决策7：排序约束

**选择**：`sort_order` 字段由前端传入，后端验证同一 `assignment_id` + 同一 `type` 下的 `sort_order` 不重复即可（简单校验）。**不强制**跨类型序号连续，前端展示时按 `type ASC, sort_order ASC` 排序分组。

**理由**：复杂的跨类型排序约束实现成本高，且业务上"同类型内排序"语义已足够清晰。

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|---------|
| 题型枚举 Map 变更（type=3 判断、type=4 填空、type=5 简答 重新排序）需要与现有数据兼容 | 确认数据库中 `course_assignment_question` 表无历史数据，或做数据迁移脚本 |
| 截止后惰性补零分在并发查询时可能重复插入 | 建议在 Service 层用 `INSERT IGNORE` 或先查询再插入，加 `(assignment_id, student_id)` 唯一索引 |
| `common.module.ts` entities 统一注册，若新实体忘记注册会导致 Repository 注入失败 | 在 task.md 中明确列出注册步骤作为检查点 |
| 多选题仅支持全对才得分可能与部分老师期望不符 | 在 API 设计中预留 `partial_score` 字段扩展空间，当前值为固定0 |

## Migration Plan

1. 手动执行 `CREATE TABLE course_question_resource ...` SQL（见决策2）。
2. 对4个现有实体执行 `ALTER TABLE` 添加缺失字段（开发环境可依赖 TypeORM `synchronize` 自动处理）。
3. 在 `src/common/utils/course.map.ts` 中更新题型 Map，确保 type 枚举值 1~5 完整覆盖。
4. 在 `common.module.ts` 中注册 `CourseQuestionResource` 实体。
5. 新增 `assignment` 模块并在 `app.module.ts` 中引入。

## Open Questions

- 无需额外确认，所有决策已在上述分析中做出。
