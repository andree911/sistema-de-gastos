import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { Transacoes, Moeda, TipoTransacao } from '../../core/transacoes';
import { TransacaoDetalhe } from './transacao-detalhe';

describe('TransacaoDetalhe', () => {
  let component: TransacaoDetalhe;
  let obterPorId: ReturnType<typeof vi.fn>;
  let atualizar: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    obterPorId = vi.fn().mockReturnValue(of({
      id: 42, descricao: 'Receita de teste', valor: 250, categoria: 'Trabalho',
      data: '2026-11-01T12:00:00Z', tipo: TipoTransacao.Receita, formaPagamento: null, moeda: Moeda.BRL,
    }));
    atualizar = vi.fn().mockReturnValue(of(undefined));
    await TestBed.configureTestingModule({
      imports: [TransacaoDetalhe],
      providers: [
        provideRouter([{ path: 'transacoes/:id', component: TransacaoDetalhe }]),
        { provide: Transacoes, useValue: { obterPorId, atualizar } },
      ],
    }).compileComponents();

    const harness = await RouterTestingHarness.create();
    component = await harness.navigateByUrl('/transacoes/42', TransacaoDetalhe);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('carrega a transação identificada na rota e preenche o formulário', () => {
    expect(obterPorId).toHaveBeenCalledWith(42);
    expect(component.form.value.descricao).toBe('Receita de teste');
    expect(component.form.value.data).toBe('2026-11-01');
    expect(component.carregando()).toBe(false);
  });

  it('salva a receita sem forma de pagamento e retorna à lista', () => {
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    component.onSubmit();
    expect(atualizar).toHaveBeenCalledWith(42, expect.objectContaining({ tipo: TipoTransacao.Receita, formaPagamento: null, valor: 250 }));
    expect(navegar).toHaveBeenCalledWith(['/transacoes']);
  });
});
