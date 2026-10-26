import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  inject,
} from '@angular/core';
import { ModalController } from '@ionic/angular';

export type WebCameraExtension = 'jpg' | 'png';

export interface WebCameraResult {
  blob: Blob;
  extension: WebCameraExtension;
}

type FacingMode = 'user' | 'environment';

@Component({
  selector: 'app-web-camera',
  templateUrl: './web-camera.component.html',
  styleUrls: ['./web-camera.component.scss'],
  standalone: false,
})
export class WebCameraComponent implements AfterViewInit, OnDestroy {
  @ViewChild('videoEl') private videoRef?: ElementRef<HTMLVideoElement>;
  @ViewChild('fileInput') private fileInputRef?: ElementRef<HTMLInputElement>;

  private readonly modalCtrl = inject(ModalController);

  facingMode: FacingMode = 'user';
  isLoading = true;
  isCapturing = false;
  hasMultipleCameras = false;
  errorMessage = '';

  private stream: MediaStream | null = null;
  private destroyed = false;

  ngAfterViewInit(): void {
    void this.startCamera();
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.stopStream();
  }

  async startCamera(): Promise<void> {
    if (this.destroyed) {
      return;
    }

    this.errorMessage = '';
    this.isLoading = true;
    this.stopStream();

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error(
          'Este navegador no permite acceder a la cámara. Podés elegir una foto desde un archivo.'
        );
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: this.facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      if (this.destroyed) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      this.stream = stream;
      const video = this.videoRef?.nativeElement;

      if (video) {
        video.srcObject = stream;
        await video.play().catch(() => undefined);
      }

      await this.detectMultipleCameras();
    } catch (error) {
      this.errorMessage = this.mapCameraError(error);
    } finally {
      this.isLoading = false;
    }
  }

  async switchCamera(): Promise<void> {
    this.facingMode = this.facingMode === 'user' ? 'environment' : 'user';
    await this.startCamera();
  }

  async capture(): Promise<void> {
    const video = this.videoRef?.nativeElement;

    if (!video || !video.videoWidth || !video.videoHeight) {
      this.errorMessage = 'La cámara todavía no está lista. Esperá un momento y volvé a intentar.';
      return;
    }

    this.isCapturing = true;

    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const context = canvas.getContext('2d');
      if (!context) {
        throw new Error('No se pudo procesar la imagen de la cámara.');
      }

      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const blob = await this.canvasToBlob(canvas);

      await this.modalCtrl.dismiss(
        { blob, extension: 'jpg' } satisfies WebCameraResult,
        'captured'
      );
    } catch (error) {
      this.errorMessage =
        error instanceof Error ? error.message : 'No se pudo tomar la foto.';
    } finally {
      this.isCapturing = false;
    }
  }

  triggerFilePicker(): void {
    this.fileInputRef?.nativeElement.click();
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.errorMessage = 'El archivo seleccionado no es una imagen.';
      return;
    }

    try {
      const result = await this.normalizeFile(file);
      await this.modalCtrl.dismiss(result, 'captured');
    } catch (error) {
      this.errorMessage =
        error instanceof Error ? error.message : 'No se pudo leer la imagen seleccionada.';
    }
  }

  async cancel(): Promise<void> {
    await this.modalCtrl.dismiss(null, 'cancelled');
  }

  private async normalizeFile(file: File): Promise<WebCameraResult> {
    if (file.type === 'image/png') {
      return { blob: file, extension: 'png' };
    }

    if (file.type === 'image/jpeg') {
      return { blob: file, extension: 'jpg' };
    }

    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;

    const context = canvas.getContext('2d');
    if (!context) {
      bitmap.close();
      throw new Error('No se pudo procesar la imagen seleccionada.');
    }

    context.drawImage(bitmap, 0, 0);
    bitmap.close();

    return { blob: await this.canvasToBlob(canvas), extension: 'jpg' };
  }

  private canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
            return;
          }

          reject(new Error('No se pudo generar la imagen.'));
        },
        'image/jpeg',
        0.85
      );
    });
  }

  private async detectMultipleCameras(): Promise<void> {
    if (!navigator.mediaDevices?.enumerateDevices) {
      this.hasMultipleCameras = false;
      return;
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      this.hasMultipleCameras =
        devices.filter((device) => device.kind === 'videoinput').length > 1;
    } catch {
      this.hasMultipleCameras = false;
    }
  }

  private stopStream(): void {
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;

    const video = this.videoRef?.nativeElement;
    if (video) {
      video.srcObject = null;
    }
  }

  private mapCameraError(error: unknown): string {
    if (error instanceof DOMException) {
      switch (error.name) {
        case 'NotAllowedError':
        case 'SecurityError':
          return 'No diste permiso para usar la cámara. Podés elegir una foto desde un archivo.';
        case 'NotFoundError':
        case 'OverconstrainedError':
          return 'No encontramos una cámara disponible en este dispositivo. Elegí una foto desde un archivo.';
        case 'NotReadableError':
          return 'La cámara está siendo usada por otra aplicación. Cerrá esa aplicación e intentá de nuevo.';
        default:
          return 'No se pudo abrir la cámara. Podés elegir una foto desde un archivo.';
      }
    }

    return error instanceof Error
      ? error.message
      : 'No se pudo abrir la cámara. Podés elegir una foto desde un archivo.';
  }
}
