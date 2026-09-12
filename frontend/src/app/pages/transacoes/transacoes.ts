import { Component, OnInit, inject, signal, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Transacoes as TransacoesService, Transacao, TipoTransacao, FormaPagamento, Moeda } from '../../core/transacoes';
import { Cambio } from '../../core/cambio';
import { Auth } from '../../core/auth';
import { Select } from '../../shared/select/select';
import { Datepicker } from '../../shared/datepicker/datepicker';

@Component({
  imports: [ReactiveFormsModule, CommonModule, RouterLink, Select, Datepicker],
  selector: 'app-transacoes',
  styleUrl: './transacoes.css',
  templateUrl: './transacoes.html',
})
export class Transacoes implements OnInit {
  private service = inject(TransacoesService);
  private cambio = inject(Cambio);
  private fb = inject(FormBuilder);
  private auth = inject(Auth);
  private router = inject(Router);

  transacoes = signal<Transacao[]>([]);
  erro = '';

  taxasCambio = signal<Record<string, number>>({ BRL: 1 });
  moedaExibicao = signal<Moeda>(Moeda.BRL);
  menuMoedaAberto = signal(false);

  moedas = [
    { valor: Moeda.BRL, nome: 'Real (BRL)' },
    { valor: Moeda.USD, nome: 'Dólar (USD)' },
    { valor: Moeda.EUR, nome: 'Euro (EUR)' },
  ];

  tiposTransacao = [
    { valor: TipoTransacao.Gasto, nome: 'Gasto' },
    { valor: TipoTransacao.Receita, nome: 'Receita' },
  ];

  formasPagamento = [
    { valor: FormaPagamento.Dinheiro, nome: 'Dinheiro' },
    { valor: FormaPagamento.Pix, nome: 'Pix' },
    { valor: FormaPagamento.CartaoDebito, nome: 'Cartão de débito' },
    { valor: FormaPagamento.CartaoCredito, nome: 'Cartão de crédito' },
    { valor: FormaPagamento.Boleto, nome: 'Boleto' },
  ];

  form = this.fb.group({
    descricao: ['', Validators.required],
    valor: [0, [Validators.required, Validators.min(0.01)]],
    categoria: ['', Validators.required],
    data: ['', Validators.required],
    tipo: [TipoTransacao.Gasto, Validators.required],
    formaPagamento: [null as FormaPagamento | null],
    moeda: [Moeda.BRL, Validators.required],
  });

  moedaExibicaoCodigo = computed(() => Moeda[this.moedaExibicao()]);

  saldo = computed(() => {
    const totalEmBRL = this.transacoes().reduce((total, t) => {
      const valorEmBRL = this.converterParaBRL(t.valor, t.moeda);
      return t.tipo === TipoTransacao.Gasto ? total - valorEmBRL : total + valorEmBRL;
    }, 0);
    return this.converterDeBRL(totalEmBRL, this.moedaExibicao());
  });

  ngOnInit(): void {
    this.carregar();
    this.cambio.buscarCotacoes('BRL', ['USD', 'EUR']).subscribe({
      next: (taxas) => this.taxasCambio.set(taxas),
      error: () => {},
    });
  }

  codigoMoeda(moeda: Moeda): string {
    return Moeda[moeda];
  }

  private converterParaBRL(valor: number, moeda: Moeda): number {
    if (moeda === Moeda.BRL) return valor;
    const taxa = this.taxasCambio()[Moeda[moeda]];
    return taxa ? valor / taxa : valor;
  }

  private converterDeBRL(valorEmBRL: number, moeda: Moeda): number {
    if (moeda === Moeda.BRL) return valorEmBRL;
    const taxa = this.taxasCambio()[Moeda[moeda]];
    return taxa ? valorEmBRL * taxa : valorEmBRL;
  }

  toggleMenuMoeda(): void {
    this.menuMoedaAberto.update((v) => !v);
  }

  selecionarMoedaExibicao(moeda: Moeda): void {
    this.moedaExibicao.set(moeda);
    this.menuMoedaAberto.set(false);
  }

  @HostListener('document:click', ['$event'])
  fecharMenuMoedaAoClicarFora(event: MouseEvent): void {
    if (!(event.target as HTMLElement).closest('.saldo-seletor')) {
      this.menuMoedaAberto.set(false);
    }
  }

  carregar(): void {
    this.service.listar().subscribe({
      next: (dados) => this.transacoes.set(dados),
      error: () => (this.erro = 'Não foi possível carregar as transações.'),
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    const valores = this.form.getRawValue();
    const tipo = Number(valores.tipo) as TipoTransacao;

    this.service
      .criar({
        descricao: valores.descricao!,
        valor: Number(valores.valor),
        categoria: valores.categoria!,
        data: new Date(valores.data!).toISOString(),
        tipo,
        formaPagamento: tipo === TipoTransacao.Gasto ? Number(valores.formaPagamento) : null,
        moeda: Number(valores.moeda),
      })
      .subscribe({
        next: () => {
          this.form.reset({ tipo: TipoTransacao.Gasto, valor: 0, formaPagamento: null, moeda: Moeda.BRL });
          this.carregar();
        },
        error: () => (this.erro = 'Não foi possível salvar a transação.'),
      });
  }

  remover(id: number): void {
    this.service.deletar(id).subscribe({
      next: () => this.carregar(),
      error: () => (this.erro = 'Não foi possível remover a transação.'),
    });
  }

  sair(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
