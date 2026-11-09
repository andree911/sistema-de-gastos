import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL } from './api.config';
import { IdiomaService } from './idioma';

export type TipoSaude = 'agua' | 'refeicao' | 'exercicio';
export interface DiarioSaude { sonoMinutos: number | null; passos: number | null; disposicao: number | null; observacoes: string; }
export interface ResumoSaude extends DiarioSaude {
  data: string; aguaMl: number; exercicioMinutos: number; refeicoes: number;
  caloriasInformadas: number; temCaloriasInformadas: boolean; temRegistro: boolean;
  proteinas: number | null; carboidratos: number | null; gorduras: number | null; refeicoesSemAlimentos: number;
}
export interface ItemRefeicaoRequest { alimentoId: number; gramas: number; itemId?: number; }
export interface RegistroSaudeRequest { data: string; tipo: TipoSaude; descricao: string; quantidade: number | null; calorias: number | null; alimentos?: ItemRefeicaoRequest[]; }
export interface RegistroSaude extends Omit<RegistroSaudeRequest, 'alimentos'> { id: number; alimentos: ItemRefeicao[]; }
export interface Alimento { id: number; nome: string; nomeOriginal?: string; traducaoDisponivel?: boolean; calorias100g: number; proteinas100g: number; carboidratos100g: number; gorduras100g: number; fonte: string; url: string; porcoes: { nome: string; gramas: number; traducaoDisponivel?: boolean }[]; }
export interface ItemRefeicao extends Omit<Alimento, 'id' | 'fonte' | 'url' | 'porcoes'> { id: number; alimentoId: number; gramas: number; calorias: number; proteinas: number; carboidratos: number; gorduras: number; }
export interface DiaSaude { resumo: ResumoSaude; registros: RegistroSaude[]; }

@Injectable({ providedIn: 'root' })
export class SaudeService {
  private http = inject(HttpClient);
  private idioma = inject(IdiomaService);
  private base = API_URL + '/saude';
  buscarAlimentos(busca: string) { return this.http.get<Alimento[]>(this.base + '/alimentos', { params: { busca, idioma: this.idioma.idioma() } }); }
  alimento(id: number) { return this.http.get<Alimento>(this.base + '/alimentos/' + id, { params: { idioma: this.idioma.idioma() } }); }
  dia(data: string) { return this.http.get<DiaSaude>(this.base + '/dias/' + data, { params: { idioma: this.idioma.idioma() } }); }
  historico(inicio: string, fim: string) { return this.http.get<ResumoSaude[]>(this.base + '/historico', { params: { inicio, fim } }); }
  salvarDiario(data: string, diario: DiarioSaude) { return this.http.put<void>(this.base + '/dias/' + data, diario); }
  salvarRegistro(registro: RegistroSaudeRequest, id?: number) {
    return id ? this.http.put<unknown>(this.base + '/registros/' + id, registro) : this.http.post<unknown>(this.base + '/registros', registro);
  }
  excluir(id: number) { return this.http.delete<void>(this.base + '/registros/' + id); }
}
