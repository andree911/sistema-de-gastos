import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Transacoes as TransacoesService, TipoTransacao, FormaPagamento, Moeda } from '../../core/transacoes';
import { Select } from '../../shared/select/select';
import { Datepicker } from '../../shared/datepicker/datepicker';

@Component({
  imports: [ReactiveFormsModule, CommonModule, RouterLink, Select, Datepicker],
  selector: 'app-transacao-detalhe',
  styleUrl: './transacao-detalhe.css',
  templateUrl: './transacao-detalhe.html',
})
export class TransacaoDetalhe implements OnInit {
  private service = inject(TransacoesService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  private id!: number;
  erro = signal('');
  carregando = signal(true);

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

  moedas = [
    { valor: Moeda.BRL, nome: 'Real (BRL)' },
    { valor: Moeda.USD, nome: 'Dólar (USD)' },
    { valor: Moeda.EUR, nome: 'Euro (EUR)' },
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

  ngOnInit(): void {
    this.id = Number(this.route.snapshot.paramMap.get('id'));

    this.service.obterPorId(this.id).subscribe({
      next: (transacao) => {
        this.form.patchValue({
          descricao: transacao.descricao,
          valor: transacao.valor,
          categoria: transacao.categoria,
          data: transacao.data.substring(0, 10),
          tipo: transacao.tipo,
          formaPagamento: transacao.formaPagamento,
          moeda: transacao.moeda,
        });
        this.carregando.set(false);
      },
      error: () => {
        this.erro.set('Transação não encontrada.');
        this.carregando.set(false);
      },
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    const valores = this.form.getRawValue();
    const tipo = Number(valores.tipo) as TipoTransacao;

    this.service
      .atualizar(this.id, {
        descricao: valores.descricao!,
        valor: Number(valores.valor),
        categoria: valores.categoria!,
        data: new Date(valores.data!).toISOString(),
        tipo,
        formaPagamento: tipo === TipoTransacao.Gasto ? Number(valores.formaPagamento) : null,
        moeda: Number(valores.moeda),
      })
      .subscribe({
        next: () => this.router.navigate(['/transacoes']),
        error: () => this.erro.set('Não foi possível salvar as alterações.'),
      });
  }
}
