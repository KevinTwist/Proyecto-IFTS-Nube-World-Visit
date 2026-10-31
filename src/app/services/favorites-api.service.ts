import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { fetchAuthSession } from 'aws-amplify/auth';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

interface FavoriteRecord {
  countryId: string;
}

@Injectable({
  providedIn: 'root',
})
export class FavoritesApiService {
  private readonly http = inject(HttpClient);

  /**
   * @function getFavoriteIds
   * @description Obtiene los IDs de los paises favoritos del usuario autenticado desde AWS.
   * @returns Lista de identificadores guardados en la base de datos.
   */
  async getFavoriteIds(): Promise<string[]> {
    const favorites = await firstValueFrom(
      this.http.get<FavoriteRecord[]>(`${environment.apiUrl}/favorites`, {
        headers: await this.getAuthHeaders(),
      })
    );

    return (favorites ?? []).map((favorite) => favorite.countryId);
  }

  /**
   * @function addFavorite
   * @description Guarda un pais como favorito del usuario autenticado.
   * @param countryId Identificador del pais a guardar.
   * @returns Promesa resuelta cuando AWS confirma el guardado.
   */
  async addFavorite(countryId: string): Promise<void> {
    await firstValueFrom(
      this.http.post<void>(
        `${environment.apiUrl}/favorites`,
        { countryId },
        { headers: await this.getAuthHeaders() }
      )
    );
  }

  /**
   * @function deleteFavorite
   * @description Elimina un pais de los favoritos del usuario autenticado.
   * @param countryId Identificador del pais a eliminar.
   * @returns Promesa resuelta cuando AWS confirma la eliminacion.
   */
  async deleteFavorite(countryId: string): Promise<void> {
    await firstValueFrom(
      this.http.delete<void>(
        `${environment.apiUrl}/favorites/${encodeURIComponent(countryId)}`,
        { headers: await this.getAuthHeaders() }
      )
    );
  }

  /**
   * @function getAuthHeaders
   * @description Construye los headers con el ID token del usuario autenticado.
   * @returns Headers HTTP listos para invocar el API Gateway.
   */
  private async getAuthHeaders(): Promise<HttpHeaders> {
    const token = await this.getIdToken();

    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
  }

  /**
   * @function getIdToken
   * @description Obtiene el ID token desde localStorage o desde la sesion de Amplify.
   * @returns Token JWT para el header Authorization.
   */
  private async getIdToken(): Promise<string> {
    const storedToken = localStorage.getItem('idToken');

    if (storedToken) {
      return storedToken;
    }

    const session = await fetchAuthSession();
    const token = session.tokens?.idToken?.toString();

    if (!token) {
      throw new Error('Tu sesión expiró. Iniciá sesión nuevamente.');
    }

    return token;
  }
}
