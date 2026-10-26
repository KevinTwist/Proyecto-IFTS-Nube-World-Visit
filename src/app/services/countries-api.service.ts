import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { EMPTY, Observable, expand, reduce } from 'rxjs';

export interface RestCountryName {
  common?: string;
  official?: string;
  translations?: Record<string, { common?: string; official?: string }>;
}

export interface RestCountry {
  names?: RestCountryName;
  codes?: {
    alpha_2?: string;
    alpha_3?: string;
  };
  capitals?: { name?: string }[];
  region?: string;
  subregion?: string;
  population?: number;
  languages?: { name?: string }[];
  currencies?: { code?: string; name?: string; symbol?: string }[];
  tlds?: string[];
  timezones?: string[];
  flag?: {
    url_png?: string;
    url_svg?: string;
  };
}

interface RestCountriesMeta {
  total: number;
  count: number;
  limit: number;
  offset: number;
  more: boolean;
}

interface RestCountriesPage {
  data: {
    objects: RestCountry[];
    meta: RestCountriesMeta;
  };
}

@Injectable({
  providedIn: 'root',
})
export class CountriesApiService {
  private readonly apiUrl = 'https://api.restcountries.com/countries/v5';
  private readonly apikey = 'rc_live_6bbadbba02cd4cb9add113cd04854e5a';
  private readonly pageSize = 100;
  private readonly fields = [
    'names.common',
    'names.official',
    'names.translations.spa',
    'codes.alpha_2',
    'codes.alpha_3',
    'capitals.name',
    'region',
    'subregion',
    'population',
    'languages.name',
    'currencies.code',
    'currencies.name',
    'currencies.symbol',
    'tlds',
    'timezones',
    'flag.url_svg',
    'flag.url_png',
  ].join(',');

  constructor(private http: HttpClient) { }

  /**
   * @function getAllCountries
   * @description Consulta Rest Countries v5 y trae todos los paises paginando por el limite del plan.
   * @returns Observable con el listado de paises crudos de la API externa.
   */
  getAllCountries(): Observable<RestCountry[]> {
    return this.fetchPage(0).pipe(
      expand((page) =>
        page.data.meta.more
          ? this.fetchPage(page.data.meta.offset + page.data.meta.count)
          : EMPTY
      ),
      reduce(
        (countries, page) => [...countries, ...page.data.objects],
        [] as RestCountry[]
      )
    );
  }

  /**
   * @function fetchPage
   * @description Solicita una pagina de paises a Rest Countries v5.
   * @param offset Cantidad de registros a omitir antes de la pagina.
   * @returns Observable con la pagina cruda (data.objects + data.meta).
   */
  private fetchPage(offset: number): Observable<RestCountriesPage> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.apikey}`,
    });
    const params = new HttpParams()
      .set('limit', this.pageSize)
      .set('offset', offset)
      .set('response_fields', this.fields);

    return this.http.get<RestCountriesPage>(this.apiUrl, { headers, params });
  }
}
