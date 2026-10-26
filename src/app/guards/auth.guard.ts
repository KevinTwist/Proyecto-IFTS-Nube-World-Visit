import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * @function authGuard
 * @description Permite navegar solo a usuarios autenticados; redirige a login si no hay sesion.
 * @returns `true` cuando el usuario esta autenticado, o `UrlTree` de redireccion.
 */
export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (await auth.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/login']);
};

/**
 * @function guestGuard
 * @description Permite rutas publicas solo a usuarios no autenticados.
 * @returns `true` para visitantes, o `UrlTree` hacia la zona privada para usuarios logueados.
 */
export const guestGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!(await auth.isAuthenticated())) {
    return true;
  }

  return router.createUrlTree(['/tabs/explorar']);
};
