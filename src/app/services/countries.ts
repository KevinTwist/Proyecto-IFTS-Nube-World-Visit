import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CountriesApiService, RestCountry } from './countries-api.service';

export type Continent = 'europe' | 'asia' | 'america' | 'africa' | 'oceania';

export interface Country {
  id: string;
  name: string;
  officialName: string;
  capital: string;
  region: string;
  continent: Continent;
  population: string;
  language: string;
  currency: string;
  domain: string;
  timezone: string;
  flag: string;
  imageUrl: string;
  description: string;
  rating: number;
  facts: string[];
  favorite: boolean;
}

export interface CountryDetailItem {
  label: string;
  value: string;
  icon: string;
}

@Injectable({
  providedIn: 'root',
})
export class Countries {
  private readonly storageKey = 'worldvisit:countries';
  private readonly favoriteIdsKey = 'worldvisit:favorite-country-ids';

  private readonly initialCountries: Country[] = [
    {
      id: 'japon',
      name: 'Japon',
      officialName: 'Estado de Japon',
      capital: 'Tokio',
      region: 'Asia Oriental',
      continent: 'asia',
      population: '125,416,877',
      language: 'Japones',
      currency: 'Yen japones (JPY)',
      domain: '.jp',
      timezone: 'UTC+09:00',
      flag: 'https://flagcdn.com/w640/jp.png',
      imageUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80',
      description: 'Cultura milenaria, templos serenos y metropolis futuristas.',
      rating: 4.9,
      facts: [
        'Tokio es una de las areas metropolitanas mas grandes del mundo.',
        'Japon tiene miles de islas, aunque solo una parte esta habitada.',
        'Su tren bala es reconocido por puntualidad y velocidad.',
      ],
      favorite: false,
    },
    {
      id: 'italia',
      name: 'Italia',
      officialName: 'Republica Italiana',
      capital: 'Roma',
      region: 'Europa del Sur',
      continent: 'europe',
      population: '59,109,668',
      language: 'Italiano',
      currency: 'Euro (EUR)',
      domain: '.it',
      timezone: 'UTC+01:00',
      flag: 'https://flagcdn.com/w640/it.png',
      imageUrl: 'https://images.unsplash.com/photo-1529260830199-42c24126f198?auto=format&fit=crop&w=1200&q=80',
      description: 'Historia, gastronomia y paisajes mediterraneos.',
      rating: 4.8,
      facts: [
        'Italia tiene una gran concentracion de sitios declarados patrimonio mundial.',
        'Roma conserva rastros centrales del Imperio Romano.',
        'Su cocina es una de las mas influyentes del mundo.',
      ],
      favorite: true,
    },
    {
      id: 'canada',
      name: 'Canada',
      officialName: 'Canada',
      capital: 'Ottawa',
      region: 'America del Norte',
      continent: 'america',
      population: '38,246,108',
      language: 'Ingles, Frances',
      currency: 'Dolar canadiense (CAD)',
      domain: '.ca',
      timezone: 'UTC-08:00 to UTC-03:30',
      flag: 'https://flagcdn.com/w640/ca.png',
      imageUrl: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
      description: 'Naturaleza amplia, ciudades multiculturales y alta calidad de vida.',
      rating: 4.7,
      facts: [
        'Canada es el segundo pais mas grande del mundo por superficie.',
        'Tiene dos idiomas oficiales: ingles y frances.',
        'Sus parques nacionales son una parte clave de su identidad turistica.',
      ],
      favorite: false,
    },
    {
      id: 'brasil',
      name: 'Brasil',
      officialName: 'Republica Federativa do Brasil',
      capital: 'Brasilia',
      region: 'America del Sur',
      continent: 'america',
      population: '212,559,409',
      language: 'Portugues',
      currency: 'Real brasileno (BRL)',
      domain: '.br',
      timezone: 'UTC-05:00 to UTC-02:00',
      flag: 'https://flagcdn.com/w640/br.png',
      imageUrl: 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?auto=format&fit=crop&w=1200&q=80',
      description: 'Diversidad natural, cultura vibrante y ciudades enormes.',
      rating: 4.7,
      facts: [
        'Brasil es el pais mas grande de America del Sur.',
        'Alberga una parte muy importante de la selva amazonica.',
        'Es el unico pais de America donde el idioma oficial es portugues.',
      ],
      favorite: true,
    },
    {
      id: 'australia',
      name: 'Australia',
      officialName: 'Mancomunidad de Australia',
      capital: 'Canberra',
      region: 'Oceania',
      continent: 'oceania',
      population: '25,700,000',
      language: 'Ingles',
      currency: 'Dolar australiano (AUD)',
      domain: '.au',
      timezone: 'UTC+08:00 to UTC+11:00',
      flag: 'https://flagcdn.com/w640/au.png',
      imageUrl: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=1200&q=80',
      description: 'Playas, ciudades costeras y naturaleza unica.',
      rating: 4.6,
      facts: [
        'Australia es un pais y continente a la vez.',
        'La Gran Barrera de Coral es uno de sus iconos naturales.',
        'Tiene una biodiversidad muy particular.',
      ],
      favorite: false,
    },
  ];

  private readonly countriesSubject = new BehaviorSubject<Country[]>(this.loadCountries());
  private readonly loadingSubject = new BehaviorSubject<boolean>(false);
  private readonly errorSubject = new BehaviorSubject<string | null>(null);

  readonly countries$ = this.countriesSubject.asObservable();
  readonly loading$ = this.loadingSubject.asObservable();
  readonly error$ = this.errorSubject.asObservable();

  constructor(private countriesApi: CountriesApiService) {
    this.loadFromApi();
  }

  /**
   * @function loadFromApi
   * @description Sincroniza el estado local con Rest Countries y normaliza datos al modelo `Country`.
   * @returns `void`.
   */
  loadFromApi(): void {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    this.countriesApi.getAllCountries().subscribe({
      next: (restCountries) => {
        const favoriteIds = this.loadFavoriteIds();
        const countries = restCountries
          .map((country) => this.mapRestCountry(country, favoriteIds))
          .filter((country): country is Country => Boolean(country))
          .sort((a, b) => a.name.localeCompare(b.name));

        this.saveCountries(countries);
        this.countriesSubject.next(countries);
        this.loadingSubject.next(false);
      },
      error: () => {
        this.errorSubject.next('No pudimos cargar paises desde la API. Mostramos datos guardados.');
        this.loadingSubject.next(false);
      },
    });
  }

  /**
   * @function getCountries
   * @description Devuelve una copia inmutable del listado de paises en memoria.
   * @returns Arreglo de paises normalizados.
   */
  getCountries(): Country[] {
    return [...this.countriesSubject.getValue()];
  }

  /**
   * @function getCountryById
   * @description Busca un pais por su identificador slug.
   * @param id Identificador unico del pais.
   * @returns Pais encontrado o `undefined` si no existe.
   */
  getCountryById(id: string): Country | undefined {
    return this.getCountries().find((country) => country.id === id);
  }

  /**
   * @function getFavorites
   * @description Obtiene todos los paises marcados como favoritos.
   * @returns Arreglo filtrado con favoritos.
   */
  getFavorites(): Country[] {
    return this.getCountries().filter((country) => country.favorite);
  }

  /**
   * @function toggleFavorite
   * @description Cambia el estado favorito de un pais y persiste cambios en almacenamiento local.
   * @param id Identificador del pais a actualizar.
   * @returns `void`.
   */
  toggleFavorite(id: string): void {
    const countries = this.getCountries().map((country) =>
      country.id === id ? { ...country, favorite: !country.favorite } : country
    );

    this.saveFavoriteIds(countries);
    this.saveCountries(countries);
    this.countriesSubject.next(countries);
  }

  /**
   * @function getDetailItems
   * @description Genera los items visuales del detalle para renderizar en la vista de informacion.
   * @param country Pais sobre el cual se arma el bloque de detalle.
   * @returns Lista de campos etiquetados con iconos.
   */
  getDetailItems(country: Country): CountryDetailItem[] {
    return [
      { label: 'Capital', value: country.capital, icon: 'business-outline' },
      { label: 'Region', value: country.region, icon: 'earth-outline' },
      { label: 'Poblacion', value: country.population, icon: 'people-outline' },
      { label: 'Idioma', value: country.language, icon: 'language-outline' },
      { label: 'Moneda', value: country.currency, icon: 'cash-outline' },
      { label: 'Dominio', value: country.domain, icon: 'globe-outline' },
      { label: 'Timezone', value: country.timezone, icon: 'time-outline' },
    ];
  }

  /**
   * @function loadCountries
   * @description Carga paises desde localStorage y usa datos iniciales si no hay persistencia valida.
   * @returns Listado de paises disponible para iniciar la app.
   */
  private loadCountries(): Country[] {
    const saved = localStorage.getItem(this.storageKey);

    if (!saved) {
      return this.initialCountries;
    }

    try {
      return JSON.parse(saved) as Country[];
    } catch {
      localStorage.removeItem(this.storageKey);
      return this.initialCountries;
    }
  }

  /**
   * @function saveCountries
   * @description Persiste en localStorage el estado actual de paises.
   * @param countries Listado completo a guardar.
   * @returns `void`.
   */
  private saveCountries(countries: Country[]): void {
    localStorage.setItem(this.storageKey, JSON.stringify(countries));
  }

  /**
   * @function loadFavoriteIds
   * @description Recupera identificadores favoritos persistidos o los deriva desde el dataset local.
   * @returns Arreglo de IDs marcados como favoritos.
   */
  private loadFavoriteIds(): string[] {
    const savedIds = localStorage.getItem(this.favoriteIdsKey);

    if (savedIds) {
      try {
        return JSON.parse(savedIds) as string[];
      } catch {
        localStorage.removeItem(this.favoriteIdsKey);
      }
    }

    return this.loadCountries()
      .filter((country) => country.favorite)
      .map((country) => country.id);
  }

  /**
   * @function saveFavoriteIds
   * @description Persiste solo los IDs favoritos para restaurarlos luego de refrescos de API.
   * @param countries Coleccion completa desde la cual se extraen favoritos.
   * @returns `void`.
   */
  private saveFavoriteIds(countries: Country[]): void {
    const favoriteIds = countries
      .filter((country) => country.favorite)
      .map((country) => country.id);

    localStorage.setItem(this.favoriteIdsKey, JSON.stringify(favoriteIds));
  }

  /**
   * @function mapRestCountry
   * @description Mapea un registro de Rest Countries al modelo de negocio `Country`.
   * @param country Pais crudo recibido desde la API externa.
   * @param favoriteIds IDs previamente marcados como favoritos.
   * @returns Pais normalizado o `null` si faltan datos minimos.
   */
  private mapRestCountry(country: RestCountry, favoriteIds: string[]): Country | null {
    const name = country.names?.translations?.['spa']?.common || country.names?.common;

    if (!name) {
      return null;
    }

    const id = this.slugify(name);
    const region = country.subregion || country.region || 'Region no informada';
    const capital = country.capitals?.[0]?.name || 'Sin capital informada';
    const language = this.formatList(
      (country.languages || [])
        .map((entry) => entry.name)
        .filter((languageName): languageName is string => Boolean(languageName))
    );
    const currency = this.formatCurrencies(country.currencies);
    const flagUrl = country.flag?.url_svg || country.flag?.url_png || '';

    return {
      id,
      name,
      officialName:
        country.names?.translations?.['spa']?.official || country.names?.official || name,
      capital,
      region,
      continent: this.mapContinent(country.region),
      population: country.population ? country.population.toLocaleString('es-AR') : 'Sin datos',
      language,
      currency,
      domain: country.tlds?.[0] || 'Sin dominio',
      timezone: country.timezones?.[0] || 'Sin zona horaria',
      flag: flagUrl,
      imageUrl: flagUrl,
      description: `${region}. Poblacion aproximada: ${
        country.population ? country.population.toLocaleString('es-AR') : 'sin datos'
      }.`,
      rating: 4.5,
      facts: [
        `Su capital es ${capital}.`,
        `Pertenece a la region ${region}.`,
        `Su poblacion aproximada es ${
          country.population ? country.population.toLocaleString('es-AR') : 'sin datos'
        }.`,
      ],
      favorite: favoriteIds.includes(id),
    };
  }

  /**
   * @function mapContinent
   * @description Convierte la region textual de API a un continente controlado por tipo.
   * @param region Region del pais proveniente de Rest Countries.
   * @returns Continente normalizado para filtros UI.
   */
  private mapContinent(region?: string): Continent {
    const normalizedRegion = (region || '').toLowerCase();

    if (normalizedRegion.includes('europe')) return 'europe';
    if (normalizedRegion.includes('asia')) return 'asia';
    if (normalizedRegion.includes('america')) return 'america';
    if (normalizedRegion.includes('africa')) return 'africa';
    if (normalizedRegion.includes('oceania')) return 'oceania';

    return 'america';
  }

  /**
   * @function formatList
   * @description Une listas de strings para mostrar datos legibles en UI.
   * @param values Valores a combinar.
   * @returns Cadena separada por coma o texto de fallback.
   */
  private formatList(values: string[]): string {
    return values.length ? values.join(', ') : 'Sin datos';
  }

  /**
   * @function formatCurrencies
   * @description Formatea monedas de API en un texto uniforme (nombre, codigo y simbolo).
   * @param currencies Arreglo de monedas de Rest Countries v5.
   * @returns Texto final de monedas para presentar en interfaz.
   */
  private formatCurrencies(currencies?: { code?: string; name?: string; symbol?: string }[]): string {
    if (!currencies?.length) {
      return 'Sin datos';
    }

    const values = currencies.map((currency) => {
      const code = currency.code || '';
      const name = currency.name || code || 'Moneda';

      if (code && currency.symbol) {
        return `${name} (${code}, ${currency.symbol})`;
      }

      return code ? `${name} (${code})` : name;
    });

    return this.formatList(values);
  }

  /**
   * @function slugify
   * @description Normaliza un nombre de pais a slug URL-safe para routing interno.
   * @param value Texto base a normalizar.
   * @returns Identificador en minusculas y guiones.
   */
  private slugify(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
