import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

const apiUrlPattern = new RegExp(`^${environment.apiUrl}(\/.*)?$`, 'i');

export const credentialsInterceptor: HttpInterceptorFn = (req, next) => {
  if (apiUrlPattern.test(req.url)) {
    req = req.clone({ withCredentials: true });
  }

  return next(req);
};
