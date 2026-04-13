import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { BrowserStorageService } from '../services/browser-storage.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const storage = inject(BrowserStorageService);
  const token = storage.getItem('token');

  if (!token || req.url.includes('/api/auth/login') || req.url.includes('/api/auth/register')) {
    return next(req);
  }

  return next(
    req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    })
  );
};
