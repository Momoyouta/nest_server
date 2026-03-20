---
trigger: always_on
---

- map映射文件创建在src/common/utils下,命名格式为:xxx.map.ts，硬性枚举都要创建统一管理
- 必须遵循README.md
- 与数据库相关时调用mysql mcp
- 区分管理端和用户端接口使用/src/common/decorators/admin-auth.decorator.ts，管理端用户端使用的jwt不同
- @Role('')用于对接口进行权限控制
- @isPublic()用于开放接口，不需要jwt验证
- plan必须用中文编写