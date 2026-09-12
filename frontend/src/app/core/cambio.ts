import { Service, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

interface TaxaFrankfurter {
  date: string;
  base: string;
  quote: string;
  rate: number;
}

@Service()
export class Cambio {
  private http = inject(HttpClient);

  buscarCotacoes(moedaBase: string, moedasDestino: string[]): Observable<Record<string, number>> {
    const quotes = moedasDestino.join(',');
    return this.http
      .get<TaxaFrankfurter[]>(`https://api.frankfurter.dev/v2/rates?base=${moedaBase}&quotes=${quotes}`)
      .pipe(
        map((taxas) => {
          const mapa: Record<string, number> = { [moedaBase]: 1 };
          for (const taxa of taxas) {
            mapa[taxa.quote] = taxa.rate;
          }
          return mapa;
        })
      );
  }
}
