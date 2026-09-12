import { Service, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from './api.config';

export enum TipoTransacao {
  Gasto = 0,
  Receita = 1,
}

export enum FormaPagamento {
  Dinheiro = 0,
  Pix = 1,
  CartaoDebito = 2,
  CartaoCredito = 3,
  Boleto = 4,
}

export interface TransacaoRequest {
  descricao: string;
  valor: number;
  categoria: string;
  data: string;
  tipo: TipoTransacao;
  formaPagamento: FormaPagamento | null;
}

export interface Transacao extends TransacaoRequest {
  id: number;
}

@Service()
export class Transacoes {
  private http = inject(HttpClient);

  listar(): Observable<Transacao[]> {
    return this.http.get<Transacao[]>(`${API_URL}/transacoes`);
  }

  criar(request: TransacaoRequest): Observable<Transacao> {
    return this.http.post<Transacao>(`${API_URL}/transacoes`, request);
  }

  atualizar(id: number, request: TransacaoRequest): Observable<void> {
    return this.http.put<void>(`${API_URL}/transacoes/${id}`, request);
  }

  deletar(id: number): Observable<void> {
    return this.http.delete<void>(`${API_URL}/transacoes/${id}`);
  }

  obterPorId(id: number): Observable<Transacao> {
  return this.http.get<Transacao>(`${API_URL}/transacoes/${id}`);
}
}