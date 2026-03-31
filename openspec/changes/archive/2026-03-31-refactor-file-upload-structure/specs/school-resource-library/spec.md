## ADDED Requirements

### Requirement: upload-to-school-resource-library
The system MUST support file uploads specifically targeted at a school's shared resource library containing subdirectories such as `videos`, `documents`, and `images`.

#### Scenario: Successfully uploading a video to the resource library
- **WHEN** user uploads a single file or a final chunk containing scenario `school_resource` with a `.mp4` file and a valid `schoolId`
- **THEN** verify the file is stored under `/schools/{schoolId}/resource_library/videos/` with the original file hash name

#### Scenario: Rejecting invalid scenario variables
- **WHEN** user uploads with scenario `school_resource` but omits `schoolId` parameter
- **THEN** system MUST throw a 400 BadRequestException with message indicating `schoolId` is required for this scenario

#### Scenario: Bulk import temporary landing zone
- **WHEN** admin uploads multiple files flagged for bulk import
- **THEN** system MUST temporarily store them under `/schools/{schoolId}/resource_library/.../bulk_import_temp/` before further scheduled scripts process them
