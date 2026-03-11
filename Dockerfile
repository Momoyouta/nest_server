FROM node:22-alpine

# 设置环境变量，确保 pnpm 安装不会因为某些证书问题报错
ENV NODE_ENV=prod

# 安装 pnpm
RUN npm install -g pnpm

WORKDIR /app

# 1. 复制依赖文件
COPY package.json ./

# 2. 安装依赖 (移除 --frozen-lockfile 除非你确定 lock 文件是 Linux 环境生成的)
# 加上 --prod 确保只安装生产环境包
RUN pnpm install --prod

# 3. 复制在本机构建好的 dist 目录
# 确保你本机已经跑过 pnpm build，且 dist 文件夹就在当前目录下
COPY dist ./dist
RUN mkdir -p /app/src/common/constants
COPY private.key /app/src/common/constants
COPY public.key /app/src/common/constants
# 4. 复制生产环境变量文件
COPY .env.prod ./

EXPOSE 3002

# 启动 (建议确认 main.js 的路径是否在 dist 根目录)
CMD ["node", "dist/main.js"]