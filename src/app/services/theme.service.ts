import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  /**
   * @function init
   * @description Aplica el tema inicial de la aplicacion al cargar el root component.
   * @returns `void`.
   */
  init(): void {
    document.documentElement.classList.add('dark');
  }
}
