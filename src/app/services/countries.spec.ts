import { TestBed } from '@angular/core/testing';
import { throwError } from 'rxjs';

import { Countries } from './countries';
import { CountriesApiService } from './countries-api.service';

describe('Countries', () => {
  let service: Countries;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        {
          provide: CountriesApiService,
          useValue: {
            getAllCountries: () => throwError(() => new Error('API unavailable in unit test')),
          },
        },
      ],
    });
    service = TestBed.inject(Countries);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return fallback countries for explore', () => {
    const countries = service.getCountries();

    expect(countries.length).toBeGreaterThan(0);
    expect(countries[0].name).toBeTruthy();
    expect(countries[0].capital).toBeTruthy();
    expect(countries[0].flag).toBeTruthy();
  });

  it('should find a country by id', () => {
    const country = service.getCountryById('brasil');

    expect(country?.name).toBe('Brasil');
  });

  it('should build detail items from a country', () => {
    const country = service.getCountryById('brasil');

    expect(country).toBeTruthy();

    const items = service.getDetailItems(country!);

    expect(items.length).toBe(7);
    expect(items.map((item) => item.label)).toEqual([
      'Capital',
      'Region',
      'Poblacion',
      'Idioma',
      'Moneda',
      'Dominio',
      'Timezone',
    ]);
  });
});
