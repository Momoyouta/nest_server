# Course Material Implementation Tasks

## 1. 数据库与 Entity 层

- [x] 1.1 执行 SQL 创建 `course_material` 表
- [x] 1.2 创建 `src/database/entities/course_material.entity.ts`
- [x] 1.3 在 `src/modules/common/common/common.module.ts` 中注册 `CourseMaterial` 实体

## 2. DTO 层

- [x] 2.1 创建 `src/modules/course/dto/course-material.dto.ts`
  - 定义 `BindMaterialDto`, `ListMaterialQueryDto`, `UpdateMaterialDto`, `DeleteMaterialDto` 等

## 3. Service 层

- [x] 3.1 创建 `src/modules/course/course-material.service.ts`
  - [x] 3.1.1 实现权限校验私有方法 (validatePermission)
  - [x] 3.1.2 实现 `bindMaterial` (上传/移动逻辑)
  - [x] 3.1.3 实现 `listMaterials` (查询逻辑)
  - [x] 3.1.4 实现 `updateMaterialName`
  - [x] 3.1.5 实现 `deleteMaterial` (多模式删除逻辑)

## 4. Controller 层

- [x] 4.1 修改或新增 Controller 暴露接口
  - 已创建 `CourseMaterialController`

## 5. 验证与清理

- [x] 5.1 验证分片上传、合并、移动到资源库的完整链路
- [x] 5.2 验证管理员与教师的交叉权限提示
- [x] 5.3 验证彻底删除是否成功清理物理文件与 `FileChunk` 记录
