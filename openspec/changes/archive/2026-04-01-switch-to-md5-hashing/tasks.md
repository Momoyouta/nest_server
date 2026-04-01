## 1. DTO 更新
- [x] 1.1 修改 `src/modules/file/chunk/dto/init-chunk.dto.ts` 中的 `fileHash` 描述，将 `SHA-256` 替换为 `MD5`。
- [x] 1.2 修改 `src/modules/file/chunk/dto/upload-chunk.dto.ts` 中的 `fileHash` 描述，将 `SHA-256` 替换为 `MD5`。
- [x] 1.3 修改 `src/modules/file/chunk/dto/merge-chunk.dto.ts` 中的 `fileHash` 描述，将 `SHA-256` 替换为 `MD5`。

## 2. Controller 更新
- [x] 2.1 修改 `src/modules/file/file.controller.ts` 中的 Swagger 注解：
  - `uploadChunk` 接口的 `ApiBody` 描述中，`fileHash` 需更新为 `MD5`。
  - `getChunkProgress` 接口的 `ApiParam` 描述中，`fileHash` 需更新为 `MD5`。

## 3. Service 与核心逻辑更新
- [x] 3.1 修改 `src/modules/file/chunk/chunk.service.ts` 中的方法注释，统一将 `SHA-256` 描述更新为 `MD5`。（经核查原 Service 中多使用 fileHash 变量名，已针对 Entity 进行了描述更新）。

## 4. 其它关联更新
- [x] 4.1 全局搜索 `SHA-256` 关键词，确保分片上传链路中无遗漏的算法描述（如在 `file-path.map.ts` 或相关 README 中）。
