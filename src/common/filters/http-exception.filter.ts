import {ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus} from "@nestjs/common";
import {Result} from "@/database/types/result.type";
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Internal server error';

        // 处理 HttpException
        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const responseData = exception.getResponse();
            message = typeof responseData === 'string'
                ? responseData
                : (responseData as any).message || message;
        }
        // 处理 TypeORM 错误
        else if (exception instanceof Error) {
            // TypeORM 错误通常有 code 属性
            const error = exception as any;

            // 数据库错误
            if (error.code === 'ER_BAD_FIELD_ERROR') {
                status = HttpStatus.INTERNAL_SERVER_ERROR;
                message = '数据库字段错误: ' + error.message;
            } else if (error.code === 'ER_NO_SUCH_TABLE') {
                status = HttpStatus.INTERNAL_SERVER_ERROR;
                message = '数据库表不存在: ' + error.message;
            } else {
                message = error.message;
            }
        }
        
        response
            .status(status)
            .json(Result.error(message, status));
    }
}