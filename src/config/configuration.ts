export default () => ({
  host: process.env.HOST ?? '0.0.0.0',
  port: Number(process.env.PORT),
  dbHost: process.env.DB_HOST ?? 'localhost',
  isGlobal: true, // 全局导入ConfigModule，false则需遵循nestJS使用@Module导入
  cache: true, // 开启缓存
  envFilePath: `.env.${process.env.NODE_ENV || 'dev'}`,
  expandVariables: true, // 扩展环境变量
});
