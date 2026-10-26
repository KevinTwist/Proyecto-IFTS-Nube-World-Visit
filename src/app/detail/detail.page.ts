import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Countries, Country, CountryDetailItem } from '../services/countries';

@Component({
  selector: 'app-detail',
  templateUrl: './detail.page.html',
  styleUrls: ['./detail.page.scss'],
  standalone: false,
})
export class DetailPage {
  country?: Country;
  detailItems: CountryDetailItem[] = [];

  constructor(
    private countriesService: Countries,
    private route: ActivatedRoute,
    private router: Router
  ) {
    const id = this.route.snapshot.paramMap.get('id');
    this.setCountry(id);

    this.countriesService.countries$.subscribe(() => {
      this.setCountry(id);
    });
  }

  /**
   * @function toggleFavorite
   * @description Alterna el estado de favorito del pais actualmente visualizado.
   * @returns `void`.
   */
  toggleFavorite(): void {
    if (!this.country) return;
    this.countriesService.toggleFavorite(this.country.id);
  }

  /**
   * @function setCountry
   * @description Resuelve el pais por ID de ruta y prepara sus campos de detalle.
   * @param id Identificador del pais en la URL.
   * @returns `void`.
   */
  private setCountry(id: string | null): void {
    if (!id) {
      this.router.navigate(['/tabs/explorar']);
      return;
    }

    this.country = this.countriesService.getCountryById(id);

    if (!this.country) {
      this.router.navigate(['/tabs/explorar']);
      return;
    }

    this.detailItems = this.countriesService.getDetailItems(this.country);
  }
}
