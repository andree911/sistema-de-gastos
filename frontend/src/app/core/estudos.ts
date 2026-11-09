import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from './api.config';
import { IdiomaService } from './idioma';

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
  topicoEstudoId?: number | null;
  topicoTitulo?: string | null;
  id: number;
  planoEstudoId: number | null;
  planoTitulo: string | null;
  licaoSlug: string | null;
  data: string;
  duracaoMinutos: number;
  observacoes: string;
}

export interface SessaoEstudoRequest {
  topicoEstudoId?: number | null;
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
  private idioma = inject(IdiomaService);
  private readonly baseUrl = `${API_URL}/estudos`;
  planejamento(): Observable<MateriaEstudo[]> { return this.http.get<MateriaEstudo[]>(`${this.baseUrl}/planejamento`); }
  buscarTemas(busca: string): Observable<TemaCatalogo[]> {
    return this.http.get<TemaCatalogo[]>(`${this.baseUrl}/catalogo`, { params: { busca, idioma: this.idioma.idioma() } });
  }
  subtemas(codigo: string): Observable<TemaCatalogo[]> {
    return this.http.get<TemaCatalogo[]>(`${this.baseUrl}/catalogo/${encodeURIComponent(codigo)}/subtemas`, { params: { idioma: this.idioma.idioma() } });
  }
  criarMateria(titulo: string, planoEstudoId: number): Observable<unknown> { return this.http.post(`${this.baseUrl}/materias`, { titulo, planoEstudoId }); }
  excluirMateria(id: number): Observable<unknown> { return this.http.delete(`${this.baseUrl}/materias/${id}`); }
  salvarTopico(materiaId: number, dados: TopicoRequest, id?: number): Observable<unknown> {
    return id ? this.http.put(`${this.baseUrl}/topicos/${id}`, dados) : this.http.post(`${this.baseUrl}/materias/${materiaId}/topicos`, dados);
  }
  excluirTopico(id: number): Observable<unknown> { return this.http.delete(`${this.baseUrl}/topicos/${id}`); }

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

export interface TopicoRequest { titulo: string; status: string; dataPrevista: string | null; fonteCatalogo?: string | null; codigoCatalogo?: string | null; }
export interface TopicoEstudo extends TopicoRequest { id: number; minutos: number; sessoes: number; }
export interface MateriaEstudo { id: number; titulo: string; planoEstudoId: number; topicos: TopicoEstudo[]; }
export interface TemaCatalogo { codigo: string; titulo: string; tituloOriginal: string | null; url: string; fonte: string; }
