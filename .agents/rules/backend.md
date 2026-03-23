---
trigger: always_on
---

- map映射文件创建在src/common/utils下,命名格式为:xxx.map.ts，硬性枚举都要创建统一管理
- 必须遵循README.md
- 创建entity必须调用mysql mcp查询对应表字段，根据表来创建
- 区分管理端和用户端接口使用/src/common/decorators/admin-auth.decorator.ts，管理端用户端使用的jwt不同
- @Role('')用于对接口进行权限控制
- @isPublic()用于开放接口，不需要jwt验证
- Implementation plan必须用中文编写
- TypeOrmModule实体的注册在src/modules/common/common/common.module.ts下，通过const entities = [User, Role];来注册实体，不需要在其他地方TypeOrmModule.forFeature()
- 创建、更新操作必须添加create_time、update_time 时间戳(s)，string