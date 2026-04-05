# Course Material Management Design

本文档详细介绍了课程资料管理功能的实现方案。该功能允许管理员和教师为课程绑定物理文件（资料），支持上传、查询、更新文件名以及解绑/彻底删除。

## 1. 数据库设计

### 1.1 新增表 `course_material`

```sql
CREATE TABLE `course_material` (
  `id` varchar(255) NOT NULL COMMENT '主键ID',
  `course_id` varchar(255) NOT NULL COMMENT '归属课程ID，关联 course 表',
  `file_id` varchar(255) NOT NULL COMMENT '资源库文件ID，关联 file_chunk 表的 id',
  `uploader_id` varchar(255) NOT NULL COMMENT '将该资料绑定到课程的教师/管理员ID',
  `create_time` varchar(255) DEFAULT NULL COMMENT '绑定时间戳(s)',
  `update_time` varchar(255) DEFAULT NULL COMMENT '更新时间戳(s)',
  PRIMARY KEY (`id`),
  KEY `idx_course_id` (`course_id`),
  KEY `idx_file_id` (`file_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='课程资料绑定表(全课程共享)';
```

## 2. 核心逻辑实现

### 2.1 资料上传与绑定

**流程**:
1. 前端通过现有分片上传接口上传文件，并调用 `merge` 接口获取 `file_id` (即 `FileChunk.id`)。
2. 调用 `POST /course/material/upload` 接口，携带 `courseId` 和 `fileId`。
3. 后端执行：
   - **权限校验**: 
     - 管理员：校验课程所属学校是否匹配。
     - 教师：校验课程所属学校，且教师必须在课程教学组中。
   - **文件移动**:
     - 从临时文件夹（`uploads/temp` 或 `uploads/temp/videos`）移动到学校资源库。
     - 目标路径：`schools/${schoolId}/resource_library/materials/${dir1}/${dir2}/${fileHash}${ext}`。
     - 更新 `FileChunk` 的 `targetPath` 指向新位置，状态设为 `done`（若已是 done 则仅更新路径）。
   - **数据记录**: 并在 `course_material` 表中创建记录。

### 2.2 查询资料

**接口**: `GET /course/material/list`
- 参数: `courseId`, `fileName` (模糊查询), `page`, `pageSize`。
- 返回: `file_id`, `fileName`, `uploader_id`, `uploaderName`, `create_time`。
- 实现: JOIN `course_material`, `file_chunk`, `user`。

### 2.3 修改资料

**接口**: `POST /course/material/update`
- 参数: `materialId`, `fileName`。
- 逻辑: 仅修改 `file_chunk` 表中对应的 `fileName`（即原始文件名）。

### 2.4 删除资料

**接口**: `POST /course/material/delete`
- 参数: `materialId`, `mode` (1: 仅解绑, 2: 彻底删除)。
- 逻辑:
  - **解绑 (Mode 1)**: 删除 `course_material` 记录。
  - **彻底删除 (Mode 2)**:
    - 删除 `course_material` 记录。
    - 检查 `course_material` 表中是否还有其他记录引用该 `file_id`。
    - 若无其他引用，调用 `storageService.deleteFile` 删除物理文件，并同步更新/删除 `file_chunk` 记录。

## 3. 模块划分

- **Entity**: `src/database/entities/course_material.entity.ts`
- **Service**: `src/modules/course/course-material.service.ts`
- **Controller**: `src/modules/course/course-material.controller.ts` (或集成在 `CourseController`)
- **DTO**: `src/modules/course/dto/course-material.dto.ts`

## 4. 权限控制

- 使用 `@AdminAuth()` 处理管理端逻辑。
- 使用 `alsService` 获取当前用户信息。
- 实现统一个权限校验私有方法。
