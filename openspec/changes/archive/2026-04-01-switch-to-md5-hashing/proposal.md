## Why
在处理 GB 级别的大型视频文件时，SHA-256 算法在浏览器端的计算开销巨大。如果直接使用 `await file.arrayBuffer()` 读入内存计算，会导致严重的 OOM（内存溢出）或页面卡死。

切换为 MD5 算法后，可以利用 `spark-md5` 库进行增量读取（逐块读取），并配合 Web Worker 在后台线程计算，极大提升了前端的稳定性和响应速度。同时 MD5 计算速度通常快于 SHA-256，适合作为秒传和断点续传的标识。

## Impact
- **后端同步更新**：虽然后端目前主要透传前端提供的 `fileHash` 进行目录隔离和状态维护，但接口文档（Swagger）及相关代码注释需明确哈希算法已切换为 MD5。
- **数据兼容性**：切换算法后，旧的基于 SHA-256 的 `file_hash` 记录将无法再次触发秒传（因为前端会发送 MD5 且哈希值不同），但这属于预期的代价。由于目前还处于开发阶段，业务影响较小。

## New Capabilities
- 无

## Modified Capabilities
- **Chunk 模块接口规范**：`fileHash` 字段含义从 SHA-256 更新为 MD5，适用于 `initUpload`、`getProgress`、`mergeChunks` 等所有涉及哈希参数的接口。
