import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Observable, Subscription, forkJoin } from 'rxjs';
import { FinancasService, Orcamento, Recorrencia, ResumoFinanceiro } from '../../core/financas';
import { FormaPagamento, Moeda } from '../../core/transacoes';
import { Select } from '../../shared/select/select';

@Component({
  selector: 'app-financas',
  imports: [CurrencyPipe, DatePipe, FormsModule, ReactiveFormsModule, RouterLink, Select],
  templateUrl: './financas.html', styleUrl: './financas.css',
})
export class Financas implements OnInit, OnDestroy {
  private service = inject(FinancasService);
  private fb = inject(FormBuilder);
  private consulta?: Subscription;
  private consultaRecorrencias?: Subscription;
  private mutacao?: Subscription;
  mes = signal(this.mesAtual());
  moeda = signal<Moeda>(Moeda.BRL);
  resumo = signal<ResumoFinanceiro | null>(null);
  orcamentos = signal<Orcamento[]>([]);
  recorrencias = signal<Recorrencia[]>([]);
  carregando = signal(true);
  carregandoRecorrencias = signal(true);
  salvando = signal(false);
  erro = signal('');
  erroRecorrencias = signal('');
  erroAcao = signal('');
  mensagem = signal('');
  formOrcamentoAberto = signal(false);
  formRecorrenciaAberto = signal(false);
  edicaoRecorrencia = signal<number | null>(null);
  codigoMoeda = computed(() => Moeda[this.moeda()]);
  recorrenciasVisiveis = computed(() => this.recorrencias().filter(r => r.moeda === this.moeda()));
  moedas = [{ valor: 0, nome: 'Real (BRL)' }, { valor: 1, nome: 'Dólar (USD)' }, { valor: 2, nome: 'Euro (EUR)' }];
  pagamentos = [
    { valor: null, nome: 'Não informada' }, { valor: FormaPagamento.Dinheiro, nome: 'Dinheiro' },
    { valor: FormaPagamento.Pix, nome: 'Pix' }, { valor: FormaPagamento.CartaoDebito, nome: 'Cartão de débito' },
    { valor: FormaPagamento.CartaoCredito, nome: 'Cartão de crédito' }, { valor: FormaPagamento.Boleto, nome: 'Boleto' },
  ];
  formOrcamento = this.fb.nonNullable.group({
    categoria: ['', [Validators.required, Validators.maxLength(100), Validators.pattern(/\S/)]],
    limite: [0, [Validators.required, Validators.min(0.01), Validators.max(999999999)]],
  });
  formRecorrencia = this.fb.nonNullable.group({
    descricao: ['', [Validators.required, Validators.maxLength(200), Validators.pattern(/\S/)]],
    categoria: ['', [Validators.required, Validators.maxLength(100), Validators.pattern(/\S/)]],
    valor: [0, [Validators.required, Validators.min(0.01), Validators.max(999999999)]],
    moeda: [Moeda.BRL, Validators.required],
    diaVencimento: [1, [Validators.required, Validators.min(1), Validators.max(31), Validators.pattern(/^\d+$/)]],
    inicio: [this.mesAtual(), [Validators.required, Validators.pattern(/^\d{4}-(0[1-9]|1[0-2])$/)]],
    fim: ['', Validators.pattern(/^\d{4}-(0[1-9]|1[0-2])$/)],
    ativa: [true],
    formaPagamento: this.fb.control<FormaPagamento | null>(null),
  });

  ngOnInit(): void { this.carregar(); this.carregarRecorrencias(); }
  ngOnDestroy(): void { this.consulta?.unsubscribe(); this.consultaRecorrencias?.unsubscribe(); this.mutacao?.unsubscribe(); }
  private mesAtual(): string {
    const hoje = new Date();
    return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
  }
  tituloMes(): string {
    return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date(this.mes() + '-15T12:00:00'));
  }
  selecionarMes(mes: string): void {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(mes) || Number(mes.slice(0, 4)) < 2000 || Number(mes.slice(0, 4)) > 2100) return;
    this.mes.set(mes); this.mensagem.set(''); this.formOrcamentoAberto.set(false); this.carregar();
  }
  navegarMes(delta: number): void {
    const data = new Date(this.mes() + '-15T12:00:00');
    data.setMonth(data.getMonth() + delta);
    this.selecionarMes(`${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`);
  }
  selecionarMoeda(moeda: Moeda): void {
    this.moeda.set(moeda); this.formOrcamentoAberto.set(false); this.mensagem.set(''); this.carregar();
  }
  carregar(): void {
    this.consulta?.unsubscribe(); this.carregando.set(true); this.erro.set(''); this.resumo.set(null); this.orcamentos.set([]);
    this.consulta = forkJoin({ resumo: this.service.resumo(this.mes(), this.moeda()), orcamentos: this.service.orcamentos(this.mes(), this.moeda()) })
      .subscribe({ next: r => { this.resumo.set(r.resumo); this.orcamentos.set(r.orcamentos); this.carregando.set(false); },
        error: () => { this.erro.set('Não foi possível carregar este mês. Tente novamente.'); this.carregando.set(false); } });
  }
  carregarRecorrencias(): void {
    this.consultaRecorrencias?.unsubscribe(); this.carregandoRecorrencias.set(true); this.erroRecorrencias.set('');
    this.consultaRecorrencias = this.service.recorrencias().subscribe({ next: r => { this.recorrencias.set(r); this.carregandoRecorrencias.set(false); },
      error: () => { this.erroRecorrencias.set('Não foi possível carregar as despesas recorrentes.'); this.carregandoRecorrencias.set(false); } });
  }
  percentual(gasto: number, limite: number | null): number { return limite && limite > 0 ? Math.max(0, Math.min(100, gasto / limite * 100)) : 0; }
  abrirOrcamento(categoria = '', limite = 0): void {
    this.formOrcamento.reset({ categoria, limite }); this.formOrcamentoAberto.set(true); this.erroAcao.set('');
  }
  salvarOrcamento(): void {
    if (this.formOrcamento.invalid || this.salvando()) return;
    const dados = this.formOrcamento.getRawValue();
    this.executar(this.service.salvarOrcamento({ ...dados, categoria: dados.categoria.trim(), mes: this.mes(), moeda: this.moeda() }),
      'Orçamento salvo.', () => { this.formOrcamentoAberto.set(false); this.carregar(); });
  }
  excluirOrcamento(orcamento: Orcamento): void {
    this.executar(this.service.excluirOrcamento(orcamento.id), 'Orçamento removido. As transações foram preservadas.', () => this.carregar());
  }
  abrirRecorrencia(recorrencia?: Recorrencia): void {
    this.edicaoRecorrencia.set(recorrencia?.id ?? null);
    this.formRecorrencia.reset({ descricao: recorrencia?.descricao ?? '', categoria: recorrencia?.categoria ?? '',
      valor: recorrencia?.valor ?? 0, moeda: recorrencia?.moeda ?? this.moeda(), diaVencimento: recorrencia?.diaVencimento ?? 1,
      inicio: recorrencia?.inicio ?? this.mes(), fim: recorrencia?.fim ?? '', ativa: recorrencia?.ativa ?? true,
      formaPagamento: recorrencia?.formaPagamento ?? null });
    this.formRecorrenciaAberto.set(true); this.erroAcao.set('');
  }
  salvarRecorrencia(): void {
    if (this.formRecorrencia.invalid || this.salvando()) return;
    const valor = this.formRecorrencia.getRawValue();
    if (valor.fim && valor.fim < valor.inicio) { this.erroAcao.set('O mês final deve ser igual ou posterior ao início.'); return; }
    this.executar(this.service.salvarRecorrencia({ ...valor, descricao: valor.descricao.trim(), categoria: valor.categoria.trim(), fim: valor.fim || null }, this.edicaoRecorrencia() ?? undefined),
      'Despesa recorrente salva. Gere os lançamentos para incluí-la no mês.', () => { this.formRecorrenciaAberto.set(false); this.carregarRecorrencias(); });
  }
  alternarRecorrencia(recorrencia: Recorrencia): void {
    const req = recorrencia.ativa ? this.service.pausarRecorrencia(recorrencia.id)
      : this.service.salvarRecorrencia({ ...recorrencia, ativa: true }, recorrencia.id);
    this.executar(req, recorrencia.ativa ? 'Recorrência pausada. Os lançamentos existentes foram preservados.' : 'Recorrência retomada.', () => this.carregarRecorrencias());
  }
  gerar(): void {
    if (this.salvando()) return;
    const mes = this.mes();
    this.executar(this.service.gerarRecorrencias(mes), '', () => this.carregar(), r => {
      const quantidade = (r as { criadas: number }).criadas;
      return `${mes}: ${quantidade === 0 ? 'nenhum novo lançamento; as despesas elegíveis já foram lançadas ou não há recorrências ativas' : quantidade + (quantidade === 1 ? ' lançamento criado' : ' lançamentos criados')}.`;
    });
  }
  private executar(req: Observable<unknown>, mensagem: string, depois: () => void, formatar?: (r: unknown) => string): void {
    if (this.salvando()) return;
    this.salvando.set(true); this.erroAcao.set(''); this.mensagem.set('');
    this.mutacao = req.subscribe({ next: r => { this.salvando.set(false); this.mensagem.set(formatar ? formatar(r) : mensagem); depois(); },
      error: () => { this.salvando.set(false); this.erroAcao.set('Não foi possível salvar a alteração. Confira os dados e tente novamente.'); } });
  }
}
