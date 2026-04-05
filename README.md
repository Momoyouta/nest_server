## 介绍

本项目为仿学习通的在线学习平台服务端，使用 NestJS 框架。平台采用 B/S 架构，前端分为用户端和管理端，使用 Vite + React + TypeScript 实现。

## 本项目技术栈

### 核心框架
- **NestJS (^11.0.0)**: 高效、可扩展的 Node.js 服务端框架。
- **TypeScript**: 静态类型支持，提升代码健壮性。

### 数据库 & ORM
- **MySQL (8.0+)**: 关系型数据库。
- **TypeORM (^0.3.0)**: 现代化的数据库 ORM 框架。
- **mysql2**: 高性能 MySQL 驱动。

### 身份认证与安全
- **JWT (@nestjs/jwt)**: 基于 JSON Web Token 的身份认证。
- **bcrypt**: 密码哈希加密。
- **AuthGuard**: 全局身份验证守卫。

### 核心功能与中间件
- **AsyncLocalStorage**: 实现请求维度的上下文隔离，用于事务管理和日志追踪。
- **RequestContextMiddleware**: 自动注入请求上下文。
- **ConfigModule**: 环境驱动的配置管理（支持 `.env.dev` 和 `.env.prod`）。
- **class-validator & class-transformer**: 自动化的数据校验与对象转换。

### 部署与工具
- **Docker**: 支持容器化部署（`docker-compose.yml`）。
- **Swagger**: 自动生成的 API 文档。
- **ESLint & Prettier**: 统一的代码风格。

## 项目结构 (src)

```bash
src/
├── app.controller.ts    # 应用示例控制器
├── app.module.ts        # 根模块
├── app.service.ts       # 应用示例服务
├── main.ts              # 入口文件
├── common/              # 公共资源
│   ├── constants/       # 常量定义
│   ├── decorators/      # 装饰器
│   ├── dto/             # 通用 DTO
│   ├── filters/         # 全局过滤器
│   ├── guard/           # 守卫
│   ├── middleware/      # 中间件
│   └── utils/           # 工具与映射
├── config/              # 配置文件与环境变量管理
├── database/            # 数据库实体与全局类型定义
│   ├── entities/        # TypeORM 实体
│   └── types/           # 数据库相关类型
├── dto/                 # 全局 DTO 定义
└── modules/             # 业务模块
    ├── async/           # AsyncLocalStorage 服务
    ├── auth/            # 身份认证
    ├── common/          # 通用业务接口
    ├── course/          # 课程管理
    ├── file/            # 文件上传与存储
    ├── invitation/      # 邀请码与关联任务
    ├── redis/           # Redis 模块
    ├── school/          # 学校管理
    ├── school_admin/    # 学校管理员管理
    ├── student/         # 学生端业务
    ├── teacher/         # 教师端业务
    └── user/            # 用户管理
```

## 静态文件存储fileStore结构
```
\fileStore
├── server.log                       
├── schools\                         # 学校业务根目录
│   └── {school_id}\                 # 租户隔离：特定学校 ID
│       ├── avatars\                 # 学校特有标识/默认头像
│       ├── resource_library\        # 🚀 核心变更：统一的校本资源库
│       │   ├── videos\              # 所有教学视频统统放在这里（管理员离线导入 / 教师单文件上传）
│       │   │   ├── {file_hash}.mp4  # 采用hash命名+目录分级
│       │   │   └── bulk_import_temp\# 管理员批量上传的临时中转区
│       │   ├── documents\           # 公共资料
│       │   │   └── {file_hash}.*    # 采用hash命名+目录分级
│       │   └── images\              # 图片资源
|       ├── private\                 # 私有文件（证明等
│       └── courses\                 # 课程数据
│           └── {course_id}\
|               ├── images\         # 图片资源
|               |   └── banner.png     
│               └── homework\        # 🚀 学生作业提交（不可共享，强绑定课程）
│                   └── {homework_id}\
│                       └── {submit_id}\
│                           └── answer.png
├── users\                           # 用户全局数据
│   └── avatars\                     # 全平台用户个人头像
│       └── {user_id}.png
└── uploads\                         # 上传缓冲区 (维持不变，处理前端单次上传)
    └── temp\
	    ├── videos 
	    |   └── {file_hash.mp4}  
        ├── document
	    |   └── {file_hash.mp4}  
	    ├── images   
	    |   └── {file_hash.png}                         
        └── chunks\                  
            └── {file_hash}\         
                └── metadata.json
```

## 快速开始

### 1. 安装依赖
```bash
pnpm install
```

### 2. 环境配置
在根目录下创建或修改 `.env.dev` (开发环境) 和 `.env.prod` (生产环境) 文件，配置数据库连接等信息。

### 3. 运行项目
```bash
# 开发模式
pnpm run start:dev

# 生产模式
pnpm run build
pnpm run start:prod
```

### 4. API 文档
启动项目后，访问 `http://localhost:3000/api` (根据配置的端口) 查看 Swagger 文档。

## openspec 规范
- 制定与实施方案时需严格遵守 `openspec/config.yaml` 文件。
- 使用 `openspec-propose` 发起变更建议。
- 使用 `openspec-apply-change` 实施任务。
