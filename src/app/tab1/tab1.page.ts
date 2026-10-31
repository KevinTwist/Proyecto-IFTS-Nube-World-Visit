import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController, ViewWillEnter } from '@ionic/angular';
import {
  ContinentFilterValue,
  filterByContinent,
} from '../components/continent-filter/continent-filter.constants';
import { Countries, Country } from '../services/countries';
import { FavoritesApiService } from '../services/favorites-api.service';

@Component({ //este decorador indica que la clase Tab1Page es un componente de Angular.
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: false,
})
export class Tab1Page implements ViewWillEnter { //esta clase representa la página principal de la aplicación, donde se muestran los países y se aplican filtros.
  countries: Country[] = [];
  searchText = '';
  selectedFilter: ContinentFilterValue = 'all';

  private readonly savingFavoriteIds = new Set<string>();

  private readonly countriesService = inject(Countries); //Obtiene los países desde CountriesService.
  private readonly router = inject(Router); // Servicio de Angular para manejar la navegación entre páginas.
  private readonly favoritesApi = inject(FavoritesApiService); // Cliente del API de favoritos en AWS.
  private readonly toastCtrl = inject(ToastController); // Muestra feedback cuando falla el guardado en AWS.

  constructor() {
    this.countries = this.countriesService.getCountries(); // Obtener la lista inicial de países desde el servicio.
    this.countriesService.countries$.subscribe((countries) => {
      this.countries = countries; // Actualizar la lista de países cada vez que el servicio emite un nuevo valor.
    });
  }

  /**
   * @function ionViewWillEnter
   * @description Refresca los favoritos del usuario desde AWS cada vez que se abre la vista.
   * @returns `void`.
   */
  ionViewWillEnter(): void {
    void this.countriesService.loadFavoritesFromApi();
  }

  /**
   * @function filteredCountries
   * @description Aplica filtro por continente y texto libre sobre nombre/capital.
   * @returns Listado visible en la pestaña Explorar.
   */

  //Filtra los países según el continente seleccionado.
  get filteredCountries(): Country[] {
    const search = this.searchText.trim().toLowerCase(); //elimina espacios en blanco y convierte el texto de búsqueda a minúsculas para hacer la búsqueda insensible a mayúsculas/minúsculas.
    const byContinent = filterByContinent(this.countries, this.selectedFilter);
    return byContinent.filter((country) => { // Aca recorro los paises filtrados por continente y aplico el filtro de búsqueda.
      const matchesSearch =
        country.name.toLowerCase().includes(search) || country.capital.toLowerCase().includes(search);
      return matchesSearch; //Devuelve solo los países que coinciden con la búsqueda.
    });
  }

  /**
   * @function onFilterChange
   * @description Actualiza el filtro de continente seleccionado en la interfaz.
   * @param filter Continente elegido por el usuario.
   * @returns `void`.
   */

  onFilterChange(filter: ContinentFilterValue): void { //Actualiza el filtro de continente seleccionado en la interfaz.
    this.selectedFilter = filter; //No devuelve ningún valor.
  }

  /**
   * @function viewDetails
   * @description Navega al detalle de un pais seleccionado.
   * @param country Pais clickeado en la lista.
   * @returns `void`.
   */
  viewDetails(country: Country): void {
    this.router.navigate(['/detail', country.id]);
  }

  /**
   * @function isSavingFavorite
   * @description Indica si un pais esta siendo guardado en AWS para evitar envios duplicados.
   * @param id Identificador del pais.
   * @returns `true` mientras la peticion esta en curso.
   */
  isSavingFavorite(id: string): boolean {
    return this.savingFavoriteIds.has(id);
  }

  /**
   * @function toggleFavorite
   * @description Agrega o elimina el favorito en AWS para el usuario logueado y actualiza el estado local.
   * @param country Pais a actualizar.
   * @param event Evento del click sobre el boton favorito.
   * @returns `void`.
   */
  async toggleFavorite(country: Country, event: Event): Promise<void> {
    event.stopPropagation();

    if (this.savingFavoriteIds.has(country.id)) {
      return;
    }

    this.savingFavoriteIds.add(country.id);

    try {
      if (country.favorite) {
        await this.favoritesApi.deleteFavorite(country.id);
      } else {
        await this.favoritesApi.addFavorite(country.id);
      }

      this.countriesService.toggleFavorite(country.id);
    } catch (error) {
      await this.showToast(
        error instanceof Error ? error.message : 'No se pudo actualizar el favorito en AWS.'
      );
    } finally {
      this.savingFavoriteIds.delete(country.id);
    }
  }

  /**
   * @function showToast
   * @description Muestra un mensaje breve cuando falla el guardado del favorito.
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

