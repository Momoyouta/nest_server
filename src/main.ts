import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port = configService.get('port');

  // app.enableCors({
  //   origin: true, // 允许的源
  //   methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // 允许的方法
  //   credentials: true, // 允许发送 cookies
  // });

  app.useGlobalFilters(new AllExceptionsFilter());

  // swagger
  const swaggerConfig = new DocumentBuilder()
    .setTitle('学习平台 - API 接口文档')
    .setDescription('提供学习平台的后端接口说明与调试。')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document);

  await app.listen(port ?? 3001);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
