export default () => ({
    host: 'localhost',
    port: process.env.PORT || 3000,
    isGlobal: true,  // 全局导入ConfigModule，false则需遵循nestJS使用@Module导入
    cache: true,  // 开启缓存
    envFilePath: `.env.${process.env.NODE_ENV || 'dev'}`,
    expandVariables: true, // 扩展环境变量
})