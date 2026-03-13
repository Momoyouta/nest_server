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
    .setTitle('API Documentation')
    .setDescription('学习平台接口文档hhhhhh')
    .setVersion('0.1')
    .build();
  const documentFactory = () =>
    SwaggerModule.createDocument(app, swaggerConfig);
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, documentFactory);

  await app.listen(port ?? 3001);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
