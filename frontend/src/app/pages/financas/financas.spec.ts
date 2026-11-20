import { TestBed } from '@angular/core/testing';
import { Subject, of } from 'rxjs';
import { vi } from 'vitest';
import { Financas } from './financas';
import { FinancasService, ResumoFinanceiro } from '../../core/financas';
import { Moeda } from '../../core/transacoes';

const resumo = (moeda = Moeda.BRL): ResumoFinanceiro => ({
  mes: '2026-11', moeda, receitas: 1200, gastos: 300, saldo: 900, categorias: [], transacoes: [],
});

describe('Finanças mensais', () => {
  let pagina: Financas;
  let service: {
    resumo: ReturnType<typeof vi.fn>;
    orcamentos: ReturnType<typeof vi.fn>;
    recorrencias: ReturnType<typeof vi.fn>;
    gerarRecorrencias: ReturnType<typeof vi.fn>;
    salvarRecorrencia: ReturnType<typeof vi.fn>;
    salvarOrcamento: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    service = {
      resumo: vi.fn().mockReturnValue(of(resumo())),
      orcamentos: vi.fn().mockReturnValue(of([])),
      recorrencias: vi.fn().mockReturnValue(of([])),
      gerarRecorrencias: vi.fn(),
      salvarRecorrencia: vi.fn().mockReturnValue(of({})),
      salvarOrcamento: vi.fn().mockReturnValue(of({})),
    };
    TestBed.configureTestingModule({ providers: [{ provide: FinancasService, useValue: service }] });
    pagina = TestBed.runInInjectionContext(() => new Financas());
    pagina.mes.set('2026-11');
  });

  afterEach(() => pagina.ngOnDestroy());

  it('descarta a consulta anterior quando a moeda muda, sem mostrar valores na moeda errada', () => {
    const reais = new Subject<ResumoFinanceiro>();
    const dolares = new Subject<ResumoFinanceiro>();
    service.resumo.mockImplementation((_mes: string, moeda: Moeda) => moeda === Moeda.BRL ? reais : dolares);
    pagina.carregar();
    pagina.selecionarMoeda(Moeda.USD);
    reais.next(resumo(Moeda.BRL)); reais.complete();
    expect(pagina.resumo()).toBeNull();
    expect(pagina.carregando()).toBe(true);
    dolares.next(resumo(Moeda.USD)); dolares.complete();
    expect(pagina.resumo()?.moeda).toBe(Moeda.USD);
    expect(pagina.carregando()).toBe(false);
  });

  it('envia o mês selecionado uma vez enquanto a geração está em andamento', () => {
    const geracao = new Subject<{ criadas: number }>();
    service.gerarRecorrencias.mockReturnValue(geracao);
    pagina.gerar(); pagina.gerar();
    expect(service.gerarRecorrencias).toHaveBeenCalledExactlyOnceWith('2026-11');
    expect(pagina.salvando()).toBe(true);
    geracao.next({ criadas: 0 }); geracao.complete();
    expect(pagina.mensagem()).toContain('nenhum novo lançamento');
    expect(pagina.salvando()).toBe(false);
  });

  it('permite tentar novamente após erro na geração sem anunciar sucesso', () => {
    const geracao = new Subject<{ criadas: number }>();
    service.gerarRecorrencias.mockReturnValue(geracao);
    pagina.gerar(); geracao.error(new Error('offline'));
    expect(pagina.salvando()).toBe(false);
    expect(pagina.erroAcao()).not.toBe('');
    expect(pagina.mensagem()).toBe('');
    service.gerarRecorrencias.mockReturnValue(of({ criadas: 2 }));
    pagina.gerar();
    expect(pagina.erroAcao()).toBe('');
    expect(pagina.mensagem()).toContain('2 lançamentos criados');
  });

  it('salva o orçamento somente no mês e moeda selecionados', () => {
    pagina.moeda.set(Moeda.EUR);
    pagina.formOrcamento.setValue({ categoria: ' Alimentação ', limite: 250 });
    pagina.salvarOrcamento();
    expect(service.salvarOrcamento).toHaveBeenCalledWith({ mes: '2026-11', moeda: Moeda.EUR, categoria: 'Alimentação', limite: 250 });
  });

  it('não cria uma recorrência com mês final anterior ao inicial', () => {
    pagina.abrirRecorrencia();
    pagina.formRecorrencia.patchValue({ descricao: 'Aluguel', categoria: 'Moradia', valor: 1000, inicio: '2026-11', fim: '2026-10' });
    pagina.salvarRecorrencia();
    expect(service.salvarRecorrencia).not.toHaveBeenCalled();
    expect(pagina.erroAcao()).toContain('mês final');
  });

  it('limita a barra a 100% quando o orçamento é excedido', () => {
    expect(pagina.percentual(150, 100)).toBe(100);
    expect(pagina.percentual(25, null)).toBe(0);
    expect(pagina.percentual(0, 100)).toBe(0);
  });
});
