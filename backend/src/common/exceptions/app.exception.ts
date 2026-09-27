import { HttpException } from '@nestjs/common';

export class AppException extends HttpException {
    constructor(
        message: string,
        error: string,
        statusCode: number,
    ) {
        super(
            {
                statusCode,
                message,
                error,
            },
            statusCode,
        );
    }
}