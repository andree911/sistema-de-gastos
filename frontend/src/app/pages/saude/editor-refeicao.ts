import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Alimento, RegistroSaude, SaudeService } from '../../core/saude';
import { Select } from '../../shared/select/select';
import { IdiomaService } from '../../core/idioma';
import { TEXTOS_REFEICAO } from './editor-refeicao-textos';

export interface AlimentoRascunho {
  chave: number; itemId?: number; alimentoId: number; nome: string; gramas: number;
  calorias100g: number; proteinas100g: number; carboidratos100g: number; gorduras100g: number;
}
export function totalNutrientes(itens: AlimentoRascunho[]) {
  const valor = (base: number, gramas: number) => Math.round((base * gramas / 100 + Number.EPSILON) * 100) / 100;
  return itens.reduce((total, i) => ({ calorias: total.calorias + valor(i.calorias100g, i.gramas),
    proteinas: total.proteinas + valor(i.proteinas100g, i.gramas), carboidratos: total.carboidratos + valor(i.carboidratos100g, i.gramas), gorduras: total.gorduras + valor(i.gorduras100g, i.gramas) }),
    { calorias: 0, proteinas: 0, carboidratos: 0, gorduras: 0 });
}

@Component({ selector: 'app-editor-refeicao', imports: [FormsModule, Select], templateUrl: './editor-refeicao.html', styleUrl: './editor-refeicao.css' })
export class EditorRefeicao implements OnChanges, OnDestroy {
  private idiomaService = inject(IdiomaService);
  get t() { return TEXTOS_REFEICAO[this.idiomaService.idioma()]; }
  get traducaoIndisponivel() { return this.idiomaService.idioma() === 'pt-BR' && (this.resultados().some(a => a.traducaoDisponivel === false) || this.selecionado()?.porcoes.some(p => p.traducaoDisponivel === false)); }
  @Input({ required: true }) data = ''; @Input() registro?: RegistroSaude;
  @Output() salvo = new EventEmitter<void>(); @Output() cancelar = new EventEmitter<void>(); @Output() ocupacao = new EventEmitter<boolean>();
  private service = inject(SaudeService); private buscaSub?: Subscription; private detalheSub?: Subscription; private gravacaoSub?: Subscription; private sequencia = 0;
  nome = ''; busca = ''; quantidade = 100; porcao = -1; caloriasAnteriores: number | null = null;
  itens = signal<AlimentoRascunho[]>([]); resultados = signal<Alimento[]>([]); selecionado = signal<Alimento | null>(null);
  buscando = signal(false); detalhando = signal(false); salvando = signal(false); pesquisou = signal(false); erro = signal('');
  ngOnChanges(): void {
    this.nome = this.registro?.descricao ?? ''; this.caloriasAnteriores = this.registro?.calorias ?? null;
    this.itens.set((this.registro?.alimentos ?? []).map(i => ({ ...i, chave: ++this.sequencia, itemId: i.id })));
  }
  ngOnDestroy(): void { this.buscaSub?.unsubscribe(); this.detalheSub?.unsubscribe(); this.gravacaoSub?.unsubscribe(); }
  pesquisar(): void {
    const termo = this.busca.trim(); if (termo.length < 2 || termo.length > 100 || this.salvando() || this.buscando()) return;
    this.buscaSub?.unsubscribe(); this.detalheSub?.unsubscribe(); this.detalhando.set(false); this.selecionado.set(null);
    this.buscando.set(true); this.pesquisou.set(false); this.resultados.set([]); this.erro.set('');
    this.buscaSub = this.service.buscarAlimentos(termo).subscribe({ next: r => { this.resultados.set(r); this.buscando.set(false); this.pesquisou.set(true); },
      error: e => { this.buscando.set(false); this.erro.set(this.mensagemErro(e)); } });
  }
  escolher(alimento: Alimento): void {
    if (this.salvando()) return;
    this.detalheSub?.unsubscribe(); this.detalhando.set(true); this.selecionado.set(null); this.erro.set('');
    this.detalheSub = this.service.alimento(alimento.id).subscribe({ next: r => { this.selecionado.set(r); this.quantidade = 100; this.porcao = -1; this.detalhando.set(false); }, error: e => { this.detalhando.set(false); this.erro.set(this.mensagemErro(e)); } });
  }
  get opcoesPorcoes() { return [{ valor: -1, nome: this.t.grams }, ...(this.selecionado()?.porcoes ?? []).map((p, i) => ({ valor: i, nome: p.nome + ' (' + p.gramas + ' g)' }))]; }
  get gramas() { return Math.round(this.quantidade * (this.porcao < 0 ? 1 : this.selecionado()?.porcoes[this.porcao]?.gramas ?? 0) * 100) / 100; }
  get totais() { const totais = totalNutrientes(this.itens()); return { ...totais, calorias: Math.round(totais.calorias) }; }
  get valido() { return !!this.nome.trim() && this.nome.length <= 300 && this.itens().every(i => Number.isFinite(i.gramas) && i.gramas > 0 && i.gramas <= 5000)
    && this.itens().length <= 20 && (this.itens().length > 0 || !!this.registro?.id) && (this.itens().length > 0 || this.caloriasAnteriores === null || (Number.isInteger(this.caloriasAnteriores) && this.caloriasAnteriores >= 0 && this.caloriasAnteriores <= 20000)); }
  adicionar(): void {
    const a = this.selecionado(); if (!a || !Number.isFinite(this.gramas) || this.gramas <= 0 || this.gramas > 5000 || this.itens().length >= 20) return;
    this.itens.update(itens => [...itens, { ...a, chave: ++this.sequencia, alimentoId: a.id, gramas: this.gramas }]); this.selecionado.set(null);
  }
  ajustar(chave: number, gramas: number): void { this.itens.update(itens => itens.map(i => i.chave === chave ? { ...i, gramas: Number.isFinite(gramas) ? Math.round(gramas * 100) / 100 : 0 } : i)); }
  remover(chave: number): void { this.itens.update(itens => itens.filter(i => i.chave !== chave)); }
  salvar(): void {
    if (!this.valido || this.salvando()) return;
    this.salvando.set(true); this.ocupacao.emit(true); this.erro.set('');
    this.gravacaoSub = this.service.salvarRegistro({ data: this.data, tipo: 'refeicao', descricao: this.nome.trim(), quantidade: null,
      calorias: this.itens().length ? null : this.caloriasAnteriores,
      alimentos: this.itens().map(i => ({ alimentoId: i.alimentoId, gramas: i.gramas, itemId: i.itemId })) }, this.registro?.id).subscribe({
      next: () => { this.salvando.set(false); this.ocupacao.emit(false); this.salvo.emit(); },
      error: e => { this.salvando.set(false); this.ocupacao.emit(false); this.erro.set(this.mensagemErro(e)); },
    });
  }
  numero(n: number): string { return n.toLocaleString(this.idiomaService.idioma(), { maximumFractionDigits: 2 }); }
  private mensagemErro(e: { status: number; error: unknown }): string {
    return e.status === 429 ? this.t.rateLimit : this.idiomaService.idioma() === 'pt-BR' && typeof e.error === 'string' ? e.error : this.t.failure;
  }
}
