import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL } from './api.config';
export type TipoObjetivo = 'manual' | 'estudo' | 'habitos' | 'exercicio' | 'economia';
export interface ObjetivoRequest {
  titulo: string; tipo: TipoObjetivo; meta: number; inicio: string; fim: string; moeda: number; valorManual: number;
}
export interface Objetivo extends ObjetivoRequest { id: number; atual: number; progresso: number; unidade: string; }
@Injectable({ providedIn: 'root' })
export class ObjetivosService {
  private http = inject(HttpClient);
  private base = API_URL + '/objetivos';
  listar() { return this.http.get<Objetivo[]>(this.base); }
  salvar(dados: ObjetivoRequest, id?: number) { return id ? this.http.put(this.base + '/' + id, dados) : this.http.post(this.base, dados); }
  excluir(id: number) { return this.http.delete(this.base + '/' + id); }
}
