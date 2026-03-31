## ADDED Requirements

### Requirement: refactored-file-chunk-upload
The system MUST accept chunked file uploads and support resuming previously paused uploads, but now MUST also correctly pass the business parameters (`scenario`, `schoolId`, `courseId`, `homeworkId`) required to route the final assembled file to the correct tenant directory.

#### Scenario: Submitting a valid file chunk
- **WHEN** user sends `POST /api/upload/chunk` with a unique `fileHash`, `chunkIndex`, and correctly populated `scenario`, `schoolId` (if required by scenario) and the valid binary chunk
- **THEN** system MUST append the chunk to the generic `uploads/temp/chunks/{fileHash}/` buffer, keeping the chunking logic isolated from the business destination

#### Scenario: Merging files safely to targeted business directory
- **WHEN** user sends `POST /api/upload/merge` with `fileHash`, total number of chunks, and the target `scenario`, `schoolId`, `courseId`
- **THEN** system MUST combine the chunks from `uploads/temp/chunks/{fileHash}` and move the resulting file string to the correctly resolved business path mapped by `scenario`

#### Scenario: Missing required DTO validation fields
- **WHEN** the user calls `POST /api/upload/merge` but leaves `scenario` blank
- **THEN** system MUST reply with class-validator validation failure messages and stop the file merge process
