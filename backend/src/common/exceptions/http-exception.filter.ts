import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpException,
} from '@nestjs/common';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
    catch(exception: HttpException, host: ArgumentsHost) {
        const response = host.switchToHttp().getResponse();

        const statusCode = exception.getStatus();
        const exceptionResponse = exception.getResponse();

        response.status(statusCode).json(exceptionResponse);
    }
}