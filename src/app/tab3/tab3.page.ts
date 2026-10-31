import { Component, OnDestroy, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  LoadingController,
  ToastController,
  ViewWillEnter,
} from '@ionic/angular';
import { Subscription } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { Countries } from '../services/countries';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  standalone: false,
})
export class Tab3Page implements ViewWillEnter, OnDestroy {
  email = '';
  favoritesCount = 0;

  private favoritesSubscription?: Subscription;

  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly countriesService = inject(Countries);
  private readonly loadingCtrl = inject(LoadingController);
  private readonly toastCtrl = inject(ToastController);

  /**
   * @function ionViewWillEnter
   * @description Refresca datos del perfil y suscribe contador de favoritos al entrar en la vista.
   * @returns `void`.
   */
  ionViewWillEnter(): void {
    void this.loadProfile();
    this.refreshFavoritesCount();

    this.favoritesSubscription?.unsubscribe();
    this.favoritesSubscription = this.countriesService.countries$.subscribe(() => {
      this.refreshFavoritesCount();
    });
  }

  /**
   * @function ngOnDestroy
   * @description Libera suscripciones activas para evitar fugas de memoria.
   * @returns `void`.
   */
  ngOnDestroy(): void {
    this.favoritesSubscription?.unsubscribe();
  }

  /**
   * @function logout
   * @description Cierra sesion y redirige al flujo de login.
   * @returns `void`.
   */
  async logout(): Promise<void> {
    const loading = await this.loadingCtrl.create({ message: 'Cerrando sesión...' });
    await loading.present();

    try {
      await this.authService.logout();
      this.router.navigate(['/login']);
    } catch (error) {
      await this.showToast(
        error instanceof Error ? error.message : 'No se pudo cerrar sesión.',
        'danger'
      );
    } finally {
      await loading.dismiss();
    }
  }

  /**
   * @function loadProfile
   * @description Carga el email del usuario autenticado.
   * @returns `void`.
   */
  private async loadProfile(): Promise<void> {
    const profile = await this.authService.getCurrentUserProfile();
    this.email = profile?.email ?? '';
  }

  /**
   * @function refreshFavoritesCount
   * @description Recalcula el total de paises favoritos para mostrar en perfil.
   * @returns `void`.
   */
  private refreshFavoritesCount(): void {
    this.favoritesCount = this.countriesService.getFavorites().length;
  }

  /**
   * @function showToast
   * @description Muestra un toast con feedback de operaciones del perfil.
   * @param message Texto a mostrar.
   * @param color Estilo visual del toast.
   * @returns `void`.
   */
  private async showToast(message: string, color: string): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      color,
      position: 'top',
    });

    await toast.present();
  }
}
