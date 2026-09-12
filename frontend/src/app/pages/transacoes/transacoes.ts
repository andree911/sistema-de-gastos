import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Transacoes as TransacoesService, Transacao, TipoTransacao, FormaPagamento } from '../../core/transacoes';
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
  private fb = inject(FormBuilder);
  private auth = inject(Auth);
  private router = inject(Router);

  transacoes = signal<Transacao[]>([]);
  erro = '';

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
  });

  ngOnInit(): void {
    this.carregar();
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
      })
      .subscribe({
        next: () => {
          this.form.reset({ tipo: TipoTransacao.Gasto, valor: 0, formaPagamento: null });
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