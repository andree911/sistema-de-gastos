import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL } from './api.config';
import { CategoriaAtividade } from './rotina';

export interface HabitoRequest {
  titulo: string; categoria: CategoriaAtividade; diasSemana: number[]; inicio: string; fim: string | null;
}
export interface Habito extends HabitoRequest {
  id: number; pausado: boolean; arquivado: boolean; ocorrencias: { data: string; concluida: boolean }[];
}
@Injectable({ providedIn: 'root' })
export class HabitosService {
  private http = inject(HttpClient);
  private base = API_URL + '/habitos';
  listar(inicio: string, fim: string) { return this.http.get<Habito[]>(this.base, { params: { inicio, fim } }); }
  salvar(dados: HabitoRequest, id?: number) {
    return id ? this.http.put(this.base + '/' + id, dados) : this.http.post(this.base, dados);
  }
  pausar(id: number, pausado: boolean, data: string) { return this.http.put(this.base + '/' + id + '/pausa', { pausado, data }); }
  concluir(id: number, data: string, concluida: boolean) { return this.http.put(this.base + '/' + id + '/conclusoes/' + data, { concluida }); }
  arquivar(id: number) { return this.http.delete(this.base + '/' + id); }
}

export function dataLocal(data = new Date()): string {
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
}
