import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map(data => {
        if (Array.isArray(data)) {
          return data.map(item => this.transformData(item));
        }
        return this.transformData(data);
      })
    );
  }

  private transformData(data: any): any {
    if (!data) return data;

    const sensitiveFields = [
      'password',
      'refreshToken',
      'roles',
      'isActive',
      'isFirstLogin',
      'deletedAt',
      'updatedAt'
    ];

    if (Array.isArray(data)) {
      return data.map(item => this.transformData(item));
    }

    if (typeof data === 'object' && data !== null) {
      const transformed = { ...data };
      
      // Remove 
      /**
       * 1. password
       * 2. refreshToken
       * and so on
       */
      sensitiveFields.forEach(field => delete transformed[field]);

      Object.keys(transformed).forEach(key => {
        if (typeof transformed[key] === 'object' && transformed[key] !== null) {
          transformed[key] = this.transformData(transformed[key]);
        }
      });

      return transformed;
    }

    return data;
  }
}