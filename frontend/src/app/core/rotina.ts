import { Service, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from './api.config';

export enum CategoriaAtividade {
  Pessoal = 0,
  Estudos = 1,
  Saude = 2,
  Financas = 3,
}

export interface AtividadeRequest {
  titulo: string;
  data: string;
  categoria: CategoriaAtividade;
  concluida: boolean;
}

export interface Atividade extends AtividadeRequest {
  id: number;
}

@Service()
export class Rotina {
  private http = inject(HttpClient);

  listar(data: string): Observable<Atividade[]> {
    return this.http.get<Atividade[]>(`${API_URL}/atividades`, { params: { data } });
  }
  listarPeriodo(inicio: string, fim: string): Observable<Atividade[]> {
    return this.http.get<Atividade[]>(`${API_URL}/atividades`, { params: { inicio, fim } });
  }

  criar(request: AtividadeRequest): Observable<Atividade> {
    return this.http.post<Atividade>(`${API_URL}/atividades`, request);
  }

  atualizar(id: number, request: AtividadeRequest): Observable<void> {
    return this.http.put<void>(`${API_URL}/atividades/${id}`, request);
  }

  deletar(id: number): Observable<void> {
    return this.http.delete<void>(`${API_URL}/atividades/${id}`);
  }
}
