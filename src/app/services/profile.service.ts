import { Injectable } from '@angular/core';
import { uploadData, getUrl } from 'aws-amplify/storage';

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
   * @description Sube una foto a AWS S3 y persiste localmente la URL publica.
   * @param userId Identificador del usuario dueño de la foto.
   * @param blob Contenido binario de la imagen.
   * @param extension Extension normalizada de la imagen (`jpg` o `png`).
   * @returns URL de descarga publica de la foto subida.
   */
  async uploadPhoto(userId: string, blob: Blob, extension: string): Promise<string> {
    const storagePath = `profiles/${userId}/avatar.${extension}`;

    try {
      // Sube el archivo a S3
      await uploadData({
        path: storagePath,
        data: blob,
        options: {
          contentType: extension === 'png' ? 'image/png' : 'image/jpeg',
        }
      }).result;

      // Obtiene la URL pública del archivo subido en S3
      const urlResult = await getUrl({
        path: storagePath,
      });

      const downloadUrl = urlResult.url.toString();
      localStorage.setItem(this.photoUrlKeyPrefix + userId, downloadUrl);

      return downloadUrl;
    } catch (error) {
      throw new Error(this.mapUploadError(error));
    }
  }

  /**
   * @function mapUploadError
   * @description Traduce errores de AWS S3 a mensajes comprensibles para UI.
   * @param error Error capturado durante la subida.
   * @returns Mensaje de error listo para mostrar al usuario.
   */
  private mapUploadError(error: unknown): string {
    if (error instanceof Error) {
      if (error.message.includes('Access Denied') || error.message.includes('unauthorized')) {
        return 'AWS rechazó la subida. Revisá los permisos o CORS del bucket S3.';
      }
      return error.message;
    }
    return 'No se pudo guardar la foto en AWS S3.';
  }
}