import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { RequestContext } from '@/database/types/RequestContext.type';
import { AsyncLocalStorage } from 'async_hooks';
@Injectable()
export class AsyncLocalstorageService implements OnModuleDestroy {
  private readonly asyncLocalStorage = new AsyncLocalStorage<RequestContext>();
  private requestCount = 0;
  run(context: RequestContext, callback: () => void) {
    context.index = ++this.requestCount;
    this.asyncLocalStorage.run(context, callback);
  }

  getStore() {
    return this.asyncLocalStorage.getStore();
  }

  getRequestId(): string | undefined {
    return this.getStore()?.requestId;
  }

  getUserId(): string | undefined {
    return this.getStore()?.userId;
  }

  onModuleDestroy() {
    this.asyncLocalStorage.disable();
  }
}
