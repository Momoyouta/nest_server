## Context

当前课程管理能力已包含创建、更新、删除、分页列表，但存在以下落差：
- 列表返回聚合统计（章节数、总课时数）而非学校名，管理端展示链路仍需额外查询学校表。
- 缺少单课程基础信息查询接口，详情页无法直接获取课程主体信息与关键关联人信息。
- 更新接口允许 description 等字段直接改写，不符合“课程基础元数据”和“教学内容维护”分离的演进方向。

现有技术约束：
- 使用 NestJS + TypeORM + MySQL。
- 接口默认 JWT 鉴权，管理端接口需使用 @AdminAuth 与角色控制。
- 返回结构统一为 Result<T>。
- Swagger 作为 OpenAPI 3.0 契约来源。

## Goals / Non-Goals

**Goals:**
- 管理端课程列表返回 school_name，并移除 chapter_count、total_lesson_count。
- 新增管理端单课程基础信息查询接口，返回 course 表除 description 外字段，并补充 school_name、creator_name、teacher_names。
- 更新接口仅允许改 name、cover_img、status，禁止 description 等其他字段通过该接口更新。
- 完整更新 DTO 与 Swagger 契约，确保前后端联调一致。

**Non-Goals:**
- 不引入新数据表或修改 TypeORM 实体列定义。
- 不新增章节、课时、作业的独立编辑接口实现。
- description 的独立维护接口不在本次交付中实现，将在后续 course 范畴迭代单独推进。
- 不调整现有管理员角色集合与鉴权框架。

## Decisions

### 决策 1：列表接口返回字段去聚合化，保留业务主字段并补学校名
- 方案：在 listCourseAdmin 查询结果中新增 school_name，删除 chapter_count、total_lesson_count 计算与返回。
- 理由：满足前端学校展示诉求，减少不必要聚合查询开销，降低列表接口复杂度。
- 备选方案：保留计数字段并额外补 school_name。
- 未选原因：会继续保留高成本聚合计算，与“移除计数返回”要求冲突。

### 决策 2：新增单课程基础信息接口而非复用列表接口
- 方案：新增 GET /course/getCourseBasicAdmin/:id。
- 鉴权：沿用 @AdminAuth + @Role(...AdminRoles)。
- 响应 data 字段：
  - 课程字段（course 表）: id, school_id, creator_id, name, cover_img, status, create_time, update_time（不含 description）
  - 关联补充字段: school_name, creator_name, teacher_names（string[]）
- 理由：语义明确、便于 Swagger 建模，避免列表接口承担详情职责。
- 备选方案：在 listCourseAdmin 增加 id 精确查询复用详情。
- 未选原因：接口职责混杂，且分页语义与单条详情语义不一致。

### 决策 3：更新接口采用字段白名单策略
- 方案：UpdateCourseDto 与 updateCourseAdmin 服务逻辑仅处理 id、name、cover_img、status。
- 校验规则：
  - id: @IsString @IsNotEmpty
  - name: @IsOptional @IsString @IsNotEmpty @MaxLength(255)
  - cover_img: @IsOptional @IsString @MaxLength(500)
  - status: @IsOptional @Type(() => Number) @IsInt @IsIn([0,1])
- 理由：防止非预期字段写入，给 description 和教学内容留出后续专用接口。
- 备选方案：在服务层忽略多余字段但 DTO 继续暴露。
- 未选原因：契约与实现不一致，易引发前端误用。

### 决策 4：实体层不改，查询层补齐关联信息
- 方案：不改 Course、School、User、Teacher 等实体结构；通过 QueryBuilder/Repository 组合查询 school_name、creator_name、teacher_names。
- 理由：本次需求是接口输出与更新边界调整，不涉及数据模型变更。
- teacher_names 排序策略：保持查询默认顺序返回，不在本次变更中增加额外排序规则。

## OpenAPI 3.0 接口契约

### 1) GET /course/listCourseAdmin
- 安全：Bearer access_token，管理员 JWT。
- Query：page、pageSize、keyword、status、school_id（延续现有校验语义）。
- 200 响应：Result<CourseListResponseDto>
- list item 字段：
  - 保留: id, school_id, creator_id, name, cover_img, status, create_time, update_time, teacher_names, creator_name
  - 新增: school_name
  - 移除: chapter_count, total_lesson_count

### 2) GET /course/getCourseBasicAdmin/:id
- 安全：Bearer access_token，管理员 JWT。
- Path：id（课程 ID，必填）。
- 200 响应：Result<CourseBasicResponseDto>
  - CourseBasicResponseDto 包含：
    - course 字段（不含 description）
    - school_name、creator_name、teacher_names
- 404：课程不存在。
- 403：学校管理员越权访问他校课程。

### 3) PUT /course/updateCourseAdmin
- 安全：Bearer access_token，管理员 JWT。
- Body：UpdateCourseDto（仅 id、name、cover_img、status）。
- 200 响应：Result<UpdateCourseResponseDto>。
- 400：参数不合法。
- 404：课程不存在。
- 403：学校管理员越权更新。

## TypeORM 实体变更

- 无实体列新增、删除或类型调整。
- 无关联关系变更。

## JWT 鉴权与守卫要求

- 三个接口均为管理端接口，必须使用 @AdminAuth。
- 必须使用 @Role(...AdminRoles) 保持角色粒度一致。
- 不使用 @Public()。

## Risks / Trade-offs

- [风险] 前端仍依赖 chapter_count、total_lesson_count 字段导致渲染异常。
  - 缓解：在变更说明中明确移除字段，并提供替代来源或置空兼容策略窗口。
- [风险] 单课程查询新增多表信息组装，可能产生额外 SQL。
  - 缓解：仅按课程 ID 查询，控制在常量级查询规模。
- [风险] 更新字段收敛后，旧调用方继续传 description 可能误认为生效。
  - 缓解：在 DTO 与 Swagger 中移除 description，并在联调说明中显式告知。

## Migration Plan

1. 更新 DTO 与 Swagger 模型，新增 CourseBasicResponseDto，调整 CourseListItemDto 与 UpdateCourseDto。
2. 修改 CourseService 的 listCourseAdmin 查询映射，删除章节/课时计数查询并补 school_name。
3. 新增 getCourseBasicAdmin 服务方法与控制器路由。
4. 收敛 updateCourseAdmin 的字段写入逻辑，仅处理 name、cover_img、status。
5. 回归验证 Swagger 文档、鉴权行为和错误码。

回滚策略：
- 若出现前端兼容问题，可回滚到上一版本接口契约；该变更不涉及数据库结构迁移，回滚成本低。

## Open Questions

无（已确认以下结论）：
- teacher_names 保持默认查询顺序返回，不增加额外排序承诺。
- description 独立维护接口后续单独推进，但继续归属 course 能力范围。
