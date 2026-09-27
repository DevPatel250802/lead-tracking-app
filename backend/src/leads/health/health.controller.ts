import { Controller, Get } from "@nestjs/common";
import { AppException } from "../../common/exceptions/app.exception";

@Controller()
export class HealthController {

    @Get()
    healthCheck() {
        return "app is running";
    }

    @Get('/test-error')
    testError() {
        throw new AppException(
            'This is for testing an Error',
            'TEST-ERROR',
            400
        );
    }

}