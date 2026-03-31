## Why

当前管理端课程列表返回了章节数、课时数等聚合字段，但未直接返回课程所属学校名称，导致管理后台展示仍需二次查询；同时，课程详情读取能力不足，无法一次获取课程基础信息与关键关联主体（学校、创建者、任课老师）信息。现有更新接口允许修改范围过宽，也与“课程基础信息与教学内容分步维护”的管理流程不一致。

## Goals

- 管理端课程列表接口直接返回学校名。
- 管理端课程列表不再返回章节数、课时数计数字段。
- 新增单课程基础信息查询接口，返回课程表除 description 外字段，并补充学校名、创建者名、任课老师姓名。
- 收敛课程更新接口可改字段，仅允许 name、cover_img、status。

## Non-goals

- 本次不新增或改造章节、课时、作业的独立维护接口。
- 本次不调整课程 description 的编辑能力到其他接口中落地实现；该能力将作为 course 范畴需求在后续迭代单独推进。
- 本次不变更课程鉴权模型与角色范围。

## What Changes

- 调整管理员分页查询课程列表接口返回结构：补充 school_name，移除 chapter_count 与 lesson_count。
- 新增管理员查询单个课程基础信息接口（基于课程 ID）。
- 修改管理员更新课程接口的入参约束与服务层更新白名单，仅更新 name、cover_img、status。
- 同步更新 DTO、Swagger 注解与 OpenAPI 响应描述，确保文档与行为一致。

将引入的新 OpenAPI 3.0 接口：
- GET /course/getCourseBasicAdmin/:id：管理员获取单个课程基础信息。

## Capabilities

### New Capabilities
- 无

### Modified Capabilities
- admin-course-management: 调整课程列表返回字段、增加单课程基础信息查询能力、收敛课程更新字段范围。

## Impact

- 影响模块：src/modules/course 下 controller、service、dto。
- 影响接口：listCourseAdmin、updateCourseAdmin，新增 getCourseBasicAdmin。
- 影响文档：Swagger 注解与 openspec/specs/admin-course-management/spec.md 增量规格。
- 对前端影响：列表与详情页字段映射需按新返回结构适配；更新表单需移除非白名单字段提交。
