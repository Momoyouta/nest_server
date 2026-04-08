## 1. 统计模块骨架与公共映射

- [x] 1.1 新建 `src/modules/statistics` 模块目录与 `statistics.module.ts`，并完成模块导出/导入配置
- [x] 1.2 在 `src/common/utils` 新建 `statistics-metric.map.ts`，统一维护指标编码、名称、单位与可见角色
- [x] 1.3 在 `src/common/utils` 新建分数段映射文件（如 `score-bucket.map.ts`），统一成绩分布桶配置
- [x] 1.4 定义统计缓存键生成规则（role + tenant + timeRange + metricSet）并封装到 statistics 公共工具

## 2. DTO 与 Swagger 契约

- [x] 2.1 创建平台/学校/教师/学生统计查询 DTO，补充 `@IsOptional`、`@IsInt`、`@Min`、`@IsIn` 等校验注解
- [x] 2.2 为全部查询 DTO 字段补充 `@ApiProperty`/`@ApiPropertyOptional`（含 description、example、required）
- [x] 2.3 创建平台/学校/教师/学生/字典响应 DTO，按看板结构拆分子对象与数组项
- [x] 2.4 为响应 DTO 的嵌套字段补充 Swagger 类型声明，确保 OpenAPI 中数组元素结构可见

## 3. 平台视角业务接口拆分

- [x] 3.1 拆分平台学校漏斗接口（`/admin/statistics/platform/school-funnel`）
- [x] 3.2 拆分平台学校总数与用户规模接口（`/school-total`、`/user-total`）
- [x] 3.3 拆分平台资源与课程概览接口（`/storage-usage`、`/course-summary`）

## 4. 学校视角业务接口拆分

- [x] 4.1 拆分学校人员与课程概览接口（`/school/statistics/people-summary`、`/course-summary`）
- [x] 4.2 拆分学校资产与学情概览接口（`/asset-summary`、`/learning-summary`）

## 5. 教师视角业务接口拆分

- [x] 5.1 拆分教师待办与提交状态接口（`/teacher/statistics/todo`、`/submission-status`）
- [x] 5.2 拆分教师课时漏斗与成绩分布接口（`/lesson-funnel`、`/score-distribution`）
- [x] 5.3 拆分教师题目分析接口（客观题正确率、填空题得分率、简答题得分率，均支持分页排序）
- [x] 5.4 新增教师课程教学组学生进度接口（`/teacher/statistics/course-group-progress`，支持分页、排序、100%筛选）

## 6. 学生视角业务接口拆分

- [x] 6.1 拆分学生课程进度与继续学习接口（`/my-courses`、`/continue-learning`）
- [x] 6.2 拆分学生待办作业与成绩单接口（`/todo-assignments`、`/grade-history`）
- [x] 6.3 新增学生课程教学组学习概览接口（`/group-learning-summary`，返回作业平均分、组内平均分排名、课程学习次数）

## 7. 通用聚合能力

- [x] 7.1 实现统计字典查询（指标定义、分数段、时间粒度）
- [x] 7.2 在教师/学生查询中统一使用 `alsService.getUserId()` 并绑定租户上下文
- [x] 7.3 接入 Redis 短期缓存并处理时间区间非法、资源不存在等异常抛出

## 8. 控制器、鉴权与 API 文档

- [x] 8.1 新增平台统计控制器并配置 `@ApiTags`、`@ApiOperation`、`@ApiResponse`、`@AdminAuth`、`@Role`
- [x] 8.2 新增学校统计控制器并配置学校管理员/平台管理员的角色访问边界
- [x] 8.3 新增教师统计控制器并配置教师角色访问与查询参数 Swagger 注解
- [x] 8.4 新增学生统计控制器并配置学生角色访问与查询参数 Swagger 注解
- [x] 8.5 新增统计字典控制器接口并补充 OpenAPI 示例返回

## 9. 聚合接口下线

- [x] 9.1 下线平台聚合接口（`/admin/statistics/platform/overview`）
- [x] 9.2 下线学校聚合接口（`/school/statistics/overview`）
- [x] 9.3 下线教师聚合接口（`/teacher/statistics/dashboard`）
- [x] 9.4 下线学生聚合接口（`/student/statistics/learning-center`）

## 10. 发布准备与联调验收

- [x] 10.1 在 Swagger 页面逐一核对统计接口参数、响应结构与权限标记
- [x] 10.2 完成平台、学校、教师、学生四角色联调走查并记录异常项
- [x] 10.3 确认新增接口上线顺序（平台/学校先行，教师/学生后开）与回滚开关说明