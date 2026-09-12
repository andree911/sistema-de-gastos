import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Auth } from './auth';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(Auth);
  const token = auth.token;

  if (!token) {
    return next(req);
  }

  const reqComToken = req.clone({
    setHeaders: { Authorization: `Bearer ${token}` },
  });

  return next(reqComToken);
};