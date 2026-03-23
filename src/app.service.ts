import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
@Injectable()
export class AppService {
  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) { }
  getHello(): string {
    return 'Hello World!2';
  }

  async getTest(): Promise<string | null> {
    this.redis.set('test', '123', 'EX', 2);
    await sleep(5000);
    const value = await this.redis.get('test');
    console.log(value)
    return value;
  }

}
