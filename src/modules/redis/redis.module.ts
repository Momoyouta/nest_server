import { Global, Module } from '@nestjs/common';
import Redis from 'ioredis';

@Global()
@Module({
  providers: [
    {
      provide: 'REDIS_CLIENT', // 自定义注入的 Token
      useFactory: () => {
        const client = new Redis({
          host: 'localhost',
          port: 6379,
          password: 'root',
          keyPrefix: 'std:cache:',
          db: 0,
        });

        client.on('error', (err) => console.error('Redis Client Error', err));
        client.on('connect', () => console.log('Redis connected successfully'));

        return client;
      },
    },
  ],
  exports: ['REDIS_CLIENT'],
})
export class RedisModule {}
