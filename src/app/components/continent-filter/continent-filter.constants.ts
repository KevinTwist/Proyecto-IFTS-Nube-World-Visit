import { Continent } from '../../services/countries';

export type ContinentFilterValue = 'all' | Continent;

export interface ContinentFilterOption {
  label: string;
  value: ContinentFilterValue;
}

export const CONTINENT_FILTERS: ContinentFilterOption[] = [
  { label: 'Todos', value: 'all' },
  { label: 'Europa', value: 'europe' },
  { label: 'Asia', value: 'asia' },
  { label: 'America', value: 'america' },
  { label: 'Africa', value: 'africa' },
  { label: 'Oceania', value: 'oceania' },
];

/**
 * @function filterByContinent
 * @description Filtra una coleccion de elementos segun el continente seleccionado.
 * @param items Coleccion de elementos con propiedad `continent`.
 * @param filter Filtro activo (`all` devuelve todos los elementos).
 * @returns Coleccion filtrada para renderizar en UI.
 */
export function filterByContinent<T extends { continent: Continent }>(
  items: T[],
  filter: ContinentFilterValue
): T[] {
  if (filter === 'all') {
    return items;
  }

  return items.filter((item) => item.continent === filter);
}
