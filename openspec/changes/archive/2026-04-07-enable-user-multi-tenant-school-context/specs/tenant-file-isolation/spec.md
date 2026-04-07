## MODIFIED Requirements

### Requirement: tenant-file-isolation
The system MUST isolate file storage by tenant and business context, and for user-side business APIs the tenant (`schoolId`) MUST come from authenticated token context (ALS) instead of client-supplied identity parameters.

#### Scenario: Resolve global users' avatar isolation path
- **WHEN** a user uploads a file with scenario `avatar`
- **THEN** the stored file path MUST resolve to `/users/avatars/{file_hash}.ext` and MUST NOT be nested under a tenant folder

#### Scenario: Resolve user-side course homework isolation path from ALS context
- **WHEN** a user uploads or merges files in user-side course homework scenario after school selection
- **THEN** the system MUST resolve storage path by `schoolId` from ALS context
- **THEN** the resulting path MUST resolve to `/schools/{schoolId}/courses/{courseId}/homework/...`
- **THEN** client request MUST NOT be required to provide `schoolId` for authorization

#### Scenario: Reject cross-tenant path forging
- **WHEN** client submits a `schoolId` different from token/ALS context (during compatibility window)
- **THEN** the system MUST ignore client-supplied tenant identity for authorization and MUST reject cross-tenant access with 403
