import { Injectable, signal } from '@angular/core';
export type Idioma = 'pt-BR' | 'en-US';

@Injectable({ providedIn: 'root' })
export class IdiomaService {
  idioma = signal<Idioma>('pt-BR');
  carregar(perfilId: number): void { this.idioma.set(localStorage.getItem('idioma-preferido:' + perfilId) === 'en-US' ? 'en-US' : 'pt-BR'); }
  salvar(perfilId: number, idioma: string): void {
    const valido: Idioma = idioma === 'en-US' ? 'en-US' : 'pt-BR';
    localStorage.setItem('idioma-preferido:' + perfilId, valido); this.idioma.set(valido);
  }
}
