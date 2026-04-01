# file-chunk-upload Specification

## Purpose
TBD - created by archiving change refactor-file-upload-structure. Update Purpose after archive.
## Requirements
### Requirement: refactored-file-chunk-upload
The system MUST accept chunked file uploads and support resuming previously paused uploads, but now MUST also correctly pass the business parameters (`scenario`, `schoolId`, `courseId`, `homeworkId`) required to route the final assembled file to the correct tenant directory. Also, the **fileHash** algorithm MUST be **MD5**.

#### Scenario: Submitting a valid file chunk using MD5
- **WHEN** user sends `POST /api/file/chunk/upload` with a unique `fileHash` (32 characters MD5 string), `chunkIndex`, and correctly populated `scenario`, `schoolId` (if required by scenario) and the valid binary chunk
- **THEN** system MUST append the chunk to the generic `uploads/temp/chunks/{fileHash}/` buffer, keeping the chunking logic isolated from the business destination

#### Scenario: Merging files safely with MD5 hash
- **WHEN** user sends `POST /api/file/chunk/merge` with `fileHash` (MD5), total number of chunks, and the target `scenario`, `schoolId`, `courseId`
- **THEN** system MUST combine the chunks from `uploads/temp/chunks/{fileHash}` and move the resulting file to the correctly resolved business path mapped by `scenario`, using the MD5 hash as the final filename.

#### Scenario: Missing required DTO validation fields
- **WHEN** the user calls `POST /api/file/chunk/merge` but leaves `scenario` blank
- **THEN** system MUST reply with class-validator validation failure messages and stop the file merge process

#### Scenario: Tracking progress with MD5 hash
- **WHEN** user queries `GET /api/file/chunk/progress/{fileHash}` where `fileHash` is MD5
- **THEN** system MUST return the registration record and list of uploaded chunks

