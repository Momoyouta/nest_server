import { Injectable, NestMiddleware } from '@nestjs/common';
import { AsyncLocalstorageService } from '@/modules/async/async/asyncLocalstorage.service';
import { RequestContext } from '@/database/types/RequestContext.type';
import { v4 } from 'uuid';

@Injectable()
export class RequestContextMiddlewareMiddleware implements NestMiddleware {
  constructor(private alsService: AsyncLocalstorageService) {}
  use(req: any, res: any, next: () => void) {
    const context: RequestContext = {
      requestId: v4(),
    };
    this.alsService.run(context, () => {
      next();
    });
  }
}
