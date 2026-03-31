## ADDED Requirements

### Requirement: tenant-file-isolation
The system MUST isolate file uploads between different tenants (schools) and business contexts (courses/homework) by dynamically resolving file storage paths based on the `scenario`, `schoolId`, `courseId`, and `homeworkId` parameters passed via API.

#### Scenario: Resolve global users' avatar isolation path
- **WHEN** a user uploads a file with scenario `avatar`
- **THEN** the stored file path MUST resolve to `/users/avatars/{file_hash}.ext` and MUST NOT be nested under a tenant's folder.

#### Scenario: Resolve course homework isolation path
- **WHEN** a user uploads a file with scenario `course_homework` and includes valid `schoolId` and `courseId`
- **THEN** the stored file path MUST resolve to `/schools/{schoolId}/courses/{courseId}/homework/...` ensuring hard isolation per tenant and course.

