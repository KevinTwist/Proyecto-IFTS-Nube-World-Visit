import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CONTINENT_FILTERS, ContinentFilterValue } from './continent-filter.constants';

@Component({
  selector: 'app-continent-filter',
  templateUrl: './continent-filter.component.html',
  styleUrls: ['./continent-filter.component.scss'],
  standalone: false,
})
export class ContinentFilterComponent {
  @Input() selectedFilter: ContinentFilterValue = 'all';
  @Output() filterChange = new EventEmitter<ContinentFilterValue>();

  readonly filters = CONTINENT_FILTERS;

  /**
   * @function selectFilter
   * @description Emite al componente padre el continente seleccionado por el usuario.
   * @param value Valor de filtro elegido.
   * @returns `void`.
   */
  selectFilter(value: ContinentFilterValue): void {
    this.filterChange.emit(value);
  }
}
