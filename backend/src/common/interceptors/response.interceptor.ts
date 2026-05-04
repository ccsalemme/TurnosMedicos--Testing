import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor
} from '@nestjs/common';
import { Observable, map } from 'rxjs';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<{ url?: string }>();

    return next.handle().pipe(
      map((data) => {
        if (data && typeof data === 'object' && 'success' in (data as object)) {
          return data;
        }

        return {
          success: true,
          data,
          timestamp: new Date().toISOString(),
          path: request.url
        };
      })
    );
  }
}
