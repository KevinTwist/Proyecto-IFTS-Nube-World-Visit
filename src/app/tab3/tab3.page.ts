import { Component, OnDestroy, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  LoadingController,
  ModalController,
  ToastController,
  ViewWillEnter,
} from '@ionic/angular';
import { Subscription } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { Countries } from '../services/countries';
import { ProfileService } from '../services/profile.service';
import {
  WebCameraComponent,
  WebCameraResult,
} from '../components/web-camera/web-camera.component';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  standalone: false,
})
export class Tab3Page implements ViewWillEnter, OnDestroy {
  email = '';
  photoUrl: string | null = null;
  favoritesCount = 0;
  uploadingPhoto = false;
  profileReady = false;

  private userId = '';
  private favoritesSubscription?: Subscription;
  private previewObjectUrl: string | null = null;

  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly countriesService = inject(Countries);
  private readonly profileService = inject(ProfileService);
  private readonly loadingCtrl = inject(LoadingController);
  private readonly modalCtrl = inject(ModalController);
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
    this.clearPreviewObjectUrl();
  }

  /**
   * @function changePhoto
   * @description Captura una nueva foto desde la camara web y la sube al AWS S3 del usuario.
   * @returns `void`.
   */
  async changePhoto(): Promise<void> {
    if (!this.profileReady || !this.userId) {
      await this.showToast('Esperá a que cargue el perfil o iniciá sesión.', 'warning');
      return;
    }

    const modal = await this.modalCtrl.create({
      component: WebCameraComponent,
      cssClass: 'web-camera-modal',
    });

    await modal.present();

    const { data, role } = await modal.onWillDismiss<WebCameraResult>();

    if (role !== 'captured' || !data) {
      return;
    }

    this.uploadingPhoto = true;
    this.setPreviewUrl(data.blob);

    const loading = await this.loadingCtrl.create({ message: 'Subiendo foto a AWS S3...' });
    await loading.present();

    try {
      const downloadUrl = await this.profileService.uploadPhoto(
        this.userId,
        data.blob,
        data.extension
      );

      this.clearPreviewObjectUrl();
      this.photoUrl = downloadUrl;

      await this.showToast('Foto de perfil guardada.', 'success');
    } catch (error) {
      this.clearPreviewObjectUrl();
      this.photoUrl = this.profileService.getCachedPhotoUrl(this.userId);

      const message =
        error instanceof Error ? error.message : 'No se pudo guardar la foto de perfil.';
      await this.showToast(message, 'danger');
    } finally {
      this.uploadingPhoto = false;
      await loading.dismiss();
    }
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
   * @description Carga email, ID y foto de perfil desde servicios de auth/cache.
   * @returns `void`.
   */
  private async loadProfile(): Promise<void> {
    this.profileReady = false;
    const profile = await this.authService.getCurrentUserProfile();

    if (!profile) {
      this.email = '';
      this.photoUrl = null;
      this.userId = '';
      this.profileReady = true;
      return;
    }

    this.userId = profile.userId;
    this.email = profile.email;
    this.photoUrl = this.profileService.getCachedPhotoUrl(profile.userId);
    this.profileReady = true;
  }

  /**
   * @function setPreviewUrl
   * @description Muestra temporalmente la foto capturada mientras se sube al storage.
   * @param blob Contenido binario de la imagen capturada.
   * @returns `void`.
   */
  private setPreviewUrl(blob: Blob): void {
    this.clearPreviewObjectUrl();
    this.previewObjectUrl = URL.createObjectURL(blob);
    this.photoUrl = this.previewObjectUrl;
  }

  /**
   * @function clearPreviewObjectUrl
   * @description Libera la URL temporal creada para la vista previa de la foto.
   * @returns `void`.
   */
  private clearPreviewObjectUrl(): void {
    if (!this.previewObjectUrl) {
      return;
    }

    URL.revokeObjectURL(this.previewObjectUrl);
    this.previewObjectUrl = null;
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