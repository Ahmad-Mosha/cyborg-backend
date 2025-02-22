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

    // Define sensitive and unnecessary fields to remove
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
      
      // Remove sensitive fields
      sensitiveFields.forEach(field => delete transformed[field]);

      // Recursively transform nested objects and arrays
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