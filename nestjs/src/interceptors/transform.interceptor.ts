import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ICommonResponse } from 'src/models/response.model';

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
