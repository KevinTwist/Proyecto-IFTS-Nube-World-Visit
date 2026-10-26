import { Component } from '@angular/core';
import { Router } from '@angular/router';
import {
  ContinentFilterValue,
  filterByContinent,
} from '../components/continent-filter/continent-filter.constants';
import { Countries, Country } from '../services/countries';

@Component({ //este decorador indica que la clase Tab1Page es un componente de Angular.
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: false,
})
export class Tab1Page { //esta clase representa la página principal de la aplicación, donde se muestran los países y se aplican filtros.
  countries: Country[] = [];
  searchText = '';
  selectedFilter: ContinentFilterValue = 'all';

  constructor(
    private countriesService: Countries, //Obtiene los países desde CountriesService.
    private router: Router // Servicio de Angular para manejar la navegación entre páginas.
  ) {
    this.countries = this.countriesService.getCountries(); // Obtener la lista inicial de países desde el servicio.
    this.countriesService.countries$.subscribe((countries) => {
      this.countries = countries; // Actualizar la lista de países cada vez que el servicio emite un nuevo valor.
    });
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
   * @function toggleFavorite
   * @description Cambia el estado de favorito sin disparar la navegacion del item.
   * @param country Pais a actualizar.
   * @param event Evento del click sobre el boton favorito.
   * @returns `void`.
   */
  toggleFavorite(country: Country, event: Event): void {
    event.stopPropagation();
    this.countriesService.toggleFavorite(country.id);
  }
}

