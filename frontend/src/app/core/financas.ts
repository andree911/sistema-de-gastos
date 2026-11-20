import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL } from './api.config';
import { FormaPagamento, Moeda, Transacao } from './transacoes';

export interface CategoriaFinanceira {
  categoria: string;
  gasto: number;
  limite: number | null;
  restante: number | null;
}

export interface ResumoFinanceiro {
  mes: string;
  moeda: Moeda;
  receitas: number;
  gastos: number;
  saldo: number;
  categorias: CategoriaFinanceira[];
  transacoes: Transacao[];
}

export interface OrcamentoRequest { mes: string; categoria: string; moeda: Moeda; limite: number; }
export interface Orcamento extends OrcamentoRequest { id: number; }
export interface RecorrenciaRequest {
  descricao: string;
  valor: number;
  categoria: string;
  moeda: Moeda;
  formaPagamento: FormaPagamento | null;
  diaVencimento: number;
  inicio: string;
  fim: string | null;
  ativa: boolean;
}
export interface Recorrencia extends RecorrenciaRequest { id: number; }

@Injectable({ providedIn: 'root' })
export class FinancasService {
  private http = inject(HttpClient);
  private base = API_URL + '/financas';
  resumo(mes: string, moeda: Moeda) {
    return this.http.get<ResumoFinanceiro>(this.base + '/resumo', { params: { mes, moeda } });
  }
  orcamentos(mes: string, moeda: Moeda) {
    return this.http.get<Orcamento[]>(this.base + '/orcamentos', { params: { mes, moeda } });
  }
  salvarOrcamento(dados: OrcamentoRequest) { return this.http.put<unknown>(this.base + '/orcamentos', dados); }
  excluirOrcamento(id: number) { return this.http.delete<void>(this.base + '/orcamentos/' + id); }
  recorrencias() { return this.http.get<Recorrencia[]>(this.base + '/recorrencias'); }
  salvarRecorrencia(dados: RecorrenciaRequest, id?: number) {
    return id ? this.http.put<unknown>(this.base + '/recorrencias/' + id, dados)
      : this.http.post<unknown>(this.base + '/recorrencias', dados);
  }
  pausarRecorrencia(id: number) { return this.http.delete<void>(this.base + '/recorrencias/' + id); }
  gerarRecorrencias(mes: string) { return this.http.post<{ criadas: number }>(this.base + '/recorrencias/gerar', { mes }); }
}
