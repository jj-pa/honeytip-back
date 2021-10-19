import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { CommonResponse, ErrorCode } from 'src/models/response.model';

@Catch()
export class AllExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getResponse();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    switch (status) {
      case HttpStatus.INTERNAL_SERVER_ERROR:
        response
          .status(status)
          .json(CommonResponse.fail('', '', ErrorCode.COMMON_SYSTEM_ERROR));
        break;
      case HttpStatus.OK:
        response
          .status(status)
          .json(CommonResponse.fail('', '', ErrorCode.COMMON_SYSTEM_ERROR));
        break;
      case HttpStatus.BAD_REQUEST:
        response
          .status(status)
          .json(
            CommonResponse.fail('', '', ErrorCode.COMMON_INVALID_PARAMETER),
          );
        break;
      default:
        break;
    }
  }
}
