import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { tap } from 'rxjs/operators';

export const loggingInterceptor: HttpInterceptorFn = (req, next) => {
  const startTime = Date.now();
  
  // Log request details
  console.group(`🚀 Request: ${req.method} ${req.url}`);
  console.log('Timestamp:', new Date().toISOString());
  console.log('Headers:', req.headers);
  if (req.body) {
    console.log('Body:', req.body);
  }
  console.groupEnd();

  return next(req).pipe(
    tap({
      next: (event) => {
        if (event instanceof HttpResponse) {
          const duration = Date.now() - startTime;
          // Log response details
          console.group(`✅ Response: ${req.method} ${req.url}`);
          console.log('Status:', event.status);
          console.log('Duration:', `${duration}ms`);
          console.log('Body:', event.body);
          console.groupEnd();
        }
      },
      error: (error) => {
        const duration = Date.now() - startTime;
        // Log error details
        console.group(`❌ Request Error: ${req.method} ${req.url}`);
        console.log('Status:', error.status);
        console.log('Duration:', `${duration}ms`);
        console.log('Error:', error);
        console.groupEnd();
      }
    })
  );
};
