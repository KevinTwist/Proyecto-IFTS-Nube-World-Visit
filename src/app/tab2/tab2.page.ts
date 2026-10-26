import { Component } from '@angular/core';
import { Router } from '@angular/router';
import {
  ContinentFilterValue,
  filterByContinent,
} from '../components/continent-filter/continent-filter.constants';
import { Countries, Country } from '../services/countries';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  standalone: false,
})
export class Tab2Page {
  selectedFilter: ContinentFilterValue = 'all';
  favoriteItems: Country[] = [];

  constructor(
    private countriesService: Countries,
    private router: Router
  ) {
    this.favoriteItems = this.countriesService.getFavorites();
    this.countriesService.countries$.subscribe(() => {
      this.favoriteItems = this.countriesService.getFavorites();
    });
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
   * @function toggleFavorite
   * @description Quita/agrega un pais de favoritos desde la lista guardada.
   * @param item Pais seleccionado.
   * @param event Evento opcional para evitar propagacion al contenedor clickeable.
   * @returns `void`.
   */
  toggleFavorite(item: Country, event?: Event): void {
    event?.stopPropagation();
    this.countriesService.toggleFavorite(item.id);
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
}

