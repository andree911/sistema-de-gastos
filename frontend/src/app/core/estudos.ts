import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from './api.config';

export interface PlanoEstudo {
  id: number;
  titulo: string;
  tema: string;
  objetivo: string;
  metaSessoesSemanais: number;
  cursoSlug: string | null;
  sessoesNaSemana: number;
  minutosNaSemana: number;
}

export interface PlanoEstudoRequest {
  titulo: string;
  tema: string;
  objetivo: string;
  metaSessoesSemanais: number;
  cursoSlug: string | null;
}

export interface SessaoEstudo {
  id: number;
  planoEstudoId: number | null;
  planoTitulo: string | null;
  licaoSlug: string | null;
  data: string;
  duracaoMinutos: number;
  observacoes: string;
}

export interface SessaoEstudoRequest {
  planoEstudoId: number | null;
  licaoSlug: string | null;
  data: string;
  duracaoMinutos: number;
  observacoes: string;
}

export interface LicaoConcluida {
  cursoSlug: string;
  licaoSlug: string;
  concluidaEm: string;
}

@Injectable({ providedIn: 'root' })
export class EstudosService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${API_URL}/estudos`;

  listarPlanos(): Observable<PlanoEstudo[]> {
    return this.http.get<PlanoEstudo[]>(`${this.baseUrl}/planos`);
  }

  criarPlano(request: PlanoEstudoRequest): Observable<PlanoEstudo> {
    return this.http.post<PlanoEstudo>(`${this.baseUrl}/planos`, request);
  }

  atualizarPlano(id: number, request: PlanoEstudoRequest): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/planos/${id}`, request);
  }

  deletarPlano(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/planos/${id}`);
  }

  listarSessoes(): Observable<SessaoEstudo[]> {
    return this.http.get<SessaoEstudo[]>(`${this.baseUrl}/sessoes`);
  }

  criarSessao(request: SessaoEstudoRequest): Observable<SessaoEstudo> {
    return this.http.post<SessaoEstudo>(`${this.baseUrl}/sessoes`, request);
  }

  deletarSessao(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/sessoes/${id}`);
  }

  listarLicoesConcluidas(): Observable<LicaoConcluida[]> {
    return this.http.get<LicaoConcluida[]>(`${this.baseUrl}/licoes-concluidas`);
  }

  concluirLicao(cursoSlug: string, licaoSlug: string): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/cursos/${cursoSlug}/licoes/${licaoSlug}/conclusao`, {});
  }

  reabrirLicao(cursoSlug: string, licaoSlug: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/cursos/${cursoSlug}/licoes/${licaoSlug}/conclusao`);
  }
}
