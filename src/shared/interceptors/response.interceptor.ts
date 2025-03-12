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
    ];

    if (Array.isArray(data)) {
      return data.map(item => this.transformData(item));
    }

    if (typeof data === 'object' && data !== null) {
      const transformed = { ...data };

      // Remove sensitive fields
      sensitiveFields.forEach(field => delete transformed[field]);

      // Handle dates specifically
      ['createdAt', 'updatedAt', 'deletedAt'].forEach(dateField => {
        if (transformed[dateField] instanceof Date) {
          transformed[dateField] = transformed[dateField].toISOString();
        }
      });

      // Transform nested objects
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