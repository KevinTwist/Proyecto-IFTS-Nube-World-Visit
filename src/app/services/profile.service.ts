import { Injectable } from '@angular/core';
import { FirebaseError } from 'firebase/app';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { getFirebaseStorage, isFirebaseConfigured } from '../config/firebase.config';

@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  private readonly photoUrlKeyPrefix = 'worldvisit:profile-photo:';

  /**
   * @function getCachedPhotoUrl
   * @description Recupera de localStorage la URL de foto de perfil asociada al usuario.
   * @param userId Identificador unico del usuario autenticado.
   * @returns URL cacheada o `null` si no existe valor guardado.
   */
  getCachedPhotoUrl(userId: string): string | null {
    return localStorage.getItem(this.photoUrlKeyPrefix + userId);
  }

  /**
   * @function uploadPhoto
   * @description Sube una foto a Firebase Storage y persiste localmente la URL publica.
   * @param userId Identificador del usuario duenio de la foto.
   * @param blob Contenido binario de la imagen.
   * @param extension Extension normalizada de la imagen (`jpg` o `png`).
   * @returns URL de descarga publica de la foto subida.
   */
  async uploadPhoto(userId: string, blob: Blob, extension: string): Promise<string> {
    if (!isFirebaseConfigured()) {
      throw new Error('Configurá Firebase en environment.ts antes de subir la foto.');
    }

    const storagePath = `profiles/${userId}/avatar.${extension}`;
    const storageRef = ref(getFirebaseStorage(), storagePath);

    try {
      await uploadBytes(storageRef, blob, {
        contentType: extension === 'png' ? 'image/png' : 'image/jpeg',
      });

      const downloadUrl = await getDownloadURL(storageRef);
      localStorage.setItem(this.photoUrlKeyPrefix + userId, downloadUrl);

      return downloadUrl;
    } catch (error) {
      throw new Error(this.mapUploadError(error));
    }
  }

  /**
   * @function mapUploadError
   * @description Traduce errores de Firebase Storage a mensajes comprensibles para UI.
   * @param error Error capturado durante la subida.
   * @returns Mensaje de error listo para mostrar al usuario.
   */
  private mapUploadError(error: unknown): string {
    if (error instanceof FirebaseError) {
      if (error.code === 'storage/unauthorized') {
        return 'Firebase rechazó la subida. Revisá las reglas de Storage en la consola.';
      }
      if (error.code === 'storage/canceled') {
        return 'La subida fue cancelada.';
      }
      return `Error al subir la foto: ${error.message}`;
    }

    if (error instanceof Error) {
      return error.message;
    }

    return 'No se pudo guardar la foto en Firebase.';
  }
}
