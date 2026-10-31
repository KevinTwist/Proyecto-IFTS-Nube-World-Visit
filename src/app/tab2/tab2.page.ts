import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController, ViewWillEnter } from '@ionic/angular';
import {
  ContinentFilterValue,
  filterByContinent,
} from '../components/continent-filter/continent-filter.constants';
import { Countries, Country } from '../services/countries';
import { FavoritesApiService } from '../services/favorites-api.service';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  standalone: false,
})
export class Tab2Page implements ViewWillEnter {
  selectedFilter: ContinentFilterValue = 'all';
  favoriteItems: Country[] = [];

  private readonly savingFavoriteIds = new Set<string>();

  private readonly countriesService = inject(Countries);
  private readonly router = inject(Router);
  private readonly favoritesApi = inject(FavoritesApiService);
  private readonly toastCtrl = inject(ToastController);

  constructor() {
    this.favoriteItems = this.countriesService.getFavorites();
    this.countriesService.countries$.subscribe(() => {
      this.favoriteItems = this.countriesService.getFavorites();
    });
  }

  /**
   * @function ionViewWillEnter
   * @description Refresca los favoritos del usuario desde AWS al abrir la pestaña.
   * @returns `void`.
   */
  ionViewWillEnter(): void {
    void this.countriesService.loadFavoritesFromApi();
  }

  /**
   * @function filteredFavorites
   * @description Filtra la lista de favoritos segun continente seleccionado.
   * @returns Coleccion de favoritos que cumple el filtro activo.
   */
  get filteredFavorites(): Country[] {
    return filterByContinent(this.favoriteItems, this.selectedFilter);
  }

  /**
   * @function onFilterChange
   * @description Actualiza el continente utilizado para filtrar favoritos.
   * @param filter Valor de filtro emitido por el componente de chips.
   * @returns `void`.
   */
  onFilterChange(filter: ContinentFilterValue): void {
    this.selectedFilter = filter;
  }

  /**
   * @function isSavingFavorite
   * @description Indica si un favorito esta siendo actualizado en AWS.
   * @param id Identificador del pais.
   * @returns `true` mientras la peticion esta en curso.
   */
  isSavingFavorite(id: string): boolean {
    return this.savingFavoriteIds.has(id);
  }

  /**
   * @function toggleFavorite
   * @description Agrega o elimina el favorito en AWS y actualiza la lista local.
   * @param item Pais seleccionado.
   * @param event Evento opcional para evitar propagacion al contenedor clickeable.
   * @returns `void`.
   */
  async toggleFavorite(item: Country, event?: Event): Promise<void> {
    event?.stopPropagation();

    if (this.savingFavoriteIds.has(item.id)) {
      return;
    }

    this.savingFavoriteIds.add(item.id);

    try {
      if (item.favorite) {
        await this.favoritesApi.deleteFavorite(item.id);
      } else {
        await this.favoritesApi.addFavorite(item.id);
      }

      this.countriesService.toggleFavorite(item.id);
    } catch (error) {
      await this.showToast(
        error instanceof Error ? error.message : 'No se pudo actualizar el favorito en AWS.'
      );
    } finally {
      this.savingFavoriteIds.delete(item.id);
    }
  }

  /**
   * @function goToExplore
   * @description Navega a la pestaña de exploracion cuando no hay favoritos visibles.
   * @returns `void`.
   */
  goToExplore(): void {
    this.router.navigate(['/tabs/explorar']);
  }

  /**
   * @function viewDetails
   * @description Abre la pantalla de detalle para el favorito seleccionado.
   * @param item Pais elegido por el usuario.
   * @returns `void`.
   */
  viewDetails(item: Country): void {
    this.router.navigate(['/detail', item.id]);
  }

  /**
   * @function showToast
   * @description Muestra un mensaje breve cuando falla la actualizacion del favorito.
   * @param message Texto a mostrar.
   * @returns `void`.
   */
  private async showToast(message: string): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      color: 'danger',
      position: 'top',
    });

    await toast.present();
  }
}

