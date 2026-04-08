## Why

当前平台缺少面向平台、学校、教师、学生四类角色的统一统计看板，运营决策、教学管理与学习督导依赖人工汇总，时效性与准确性不足。同时统计接口过去偏向聚合返回，难以按业务模块细粒度复用。

## Goals

- 建立四视角统一指标体系与看板接口口径。
- 提供按业务能力拆分的统计 API，移除聚合路由。
- 保持统一响应结构与时间范围筛选能力。

## Non-goals

- 不引入预测性算法或推荐模型。
- 不重构既有认证体系与非统计业务模块。

## What Changes

- 新增统计域能力：平台、学校、教师、学生四视角指标查询与趋势分析。
- 新增拆分统计 API（OpenAPI 3.0 注解完善）：如 `/admin/statistics/platform/school-funnel`、`/school/statistics/people-summary`、`/teacher/statistics/todo`、`/student/statistics/my-courses`。
- 下线聚合路由：`/admin/statistics/platform/overview`、`/school/statistics/overview`、`/teacher/statistics/dashboard`、`/student/statistics/learning-center`。
- 约定统计时间粒度、筛选维度与统一响应结构，便于业务端按模块复用。

## Capabilities

### New Capabilities
- `multi-role-statistics-dashboard`: 定义四类角色看板的统计指标、查询口径与接口行为。

### Modified Capabilities
- 无

## Impact

- 新增后端统计模块（Controller/Service/DTO）与拆分业务查询逻辑。
- 新增并维护 OpenAPI 统计接口文档与鉴权说明。
- 影响统计接口调用方的路由接入方式（由聚合路由迁移为拆分路由）。