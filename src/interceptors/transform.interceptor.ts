import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ICommonResponse<T> {
  result: 'SUCCESS' | 'FAIL';
  data: T | null;
  message: string;
  errorCode: string | null;
}

enum Result {
  SUCCESS,
  FAIL,
}

export class CommonResponse {
  private result: 'SUCCESS' | 'FAIL';
  private data: any;
  private message: string;
  private errorCode: string | null;

  constructor(builder) {
    this.result = builder.result;
    this.data = builder.data;
    this.message = builder.message;
    this.errorCode = builder.errorCode;
  }

  static builder() {
    return new CommonResponseBuilder();
  }

  static success(data, message?: string) {
    return CommonResponse.builder()
      .setResult(Result.SUCCESS)
      .setData(data)
      .setMessage(message)
      .build();
  }
}

export class CommonResponseBuilder {
  private result;
  private data;
  private message;
  private errorCode;

  setResult(result) {
    this.result = result;
    return this;
  }

  setData(data) {
    this.data = data;
    return this;
  }

  setMessage(message) {
    this.message = message;
    return this;
  }

  setErrorCode(errorCode) {
    this.errorCode = errorCode;
    return this;
  }

  build() {
    return new CommonResponse(this);
  }
}

enum ErrorCode {
  COMMON_SYSTEM_ERROR = '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
  COMMON_INVALID_PARAMETER = '요청한 값이 올바르지 않습니다.',
  COMMON_ILLEGAL_STATUS = '잘못된 상태 값입니다.',
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ICommonResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ICommonResponse<T>> {
    return next.handle().pipe(
      map((response: ICommonResponse<T>) => ({
        result: response.result,
        data: response.data,
        message: response.message || 'Success...',
        errorCode: response.errorCode,
      })),
    );
  }
}
