import { AlimentoRascunho, totalNutrientes } from './editor-refeicao';
import { EditorRefeicao } from './editor-refeicao';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { IdiomaService } from '../../core/idioma';
import { SaudeService } from '../../core/saude';

describe('Idioma e estado do editor de refeição', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [EditorRefeicao], providers: [provideHttpClient(), provideHttpClientTesting()] }));

  it('envia o idioma escolhido tanto na busca quanto nas porções', () => {
    const idioma = TestBed.inject(IdiomaService);
    idioma.idioma.set('en-US');
    const service = TestBed.inject(SaudeService);
    const http = TestBed.inject(HttpTestingController);
    service.buscarAlimentos('rice').subscribe();
    const busca = http.expectOne(r => r.url.endsWith('/alimentos') && r.params.get('idioma') === 'en-US');
    busca.flush([]);
    idioma.idioma.set('pt-BR');
    service.alimento(123).subscribe();
    http.expectOne(r => r.url.endsWith('/alimentos/123') && r.params.get('idioma') === 'pt-BR').flush({});
    http.verify();
  });

  it('usa os textos em inglês e não confunde formulário incompleto com gravação em andamento', async () => {
    TestBed.inject(IdiomaService).idioma.set('en-US');
    const fixture = TestBed.createComponent(EditorRefeicao);
    fixture.componentRef.setInput('data', '2026-11-05');
    await fixture.whenStable();
    const botoes: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('button'));
    const salvar = botoes.find(b => b.textContent?.trim() === 'Save meal')!;
    expect(salvar.disabled).toBe(true);
    expect(salvar.getAttribute('aria-busy')).toBe('false');
    expect(fixture.nativeElement.textContent).toContain('Search food by name');
    TestBed.inject(IdiomaService).idioma.set('pt-BR');
    await fixture.whenStable();
    expect(salvar.textContent?.trim()).toBe('Salvar refeição');
    expect(salvar.getAttribute('aria-busy')).toBe('false');
  });
});

describe('Cálculo das porções de uma refeição', () => {
  const alimento: AlimentoRascunho = { chave: 1, alimentoId: 1, nome: 'Alimento de teste', gramas: 100,
    calorias100g: 120, proteinas100g: 5, carboidratos100g: 15, gorduras100g: 4 };

  it('escala calorias e cada macronutriente pela quantidade consumida', () => {
    expect(totalNutrientes([{ ...alimento, gramas: 150 }])).toEqual({ calorias: 180, proteinas: 7.5, carboidratos: 22.5, gorduras: 6 });
  });

  it('soma ingredientes diferentes em vez de substituir a refeição anterior', () => {
    expect(totalNutrientes([alimento, { ...alimento, chave: 2, gramas: 50, calorias100g: 80, proteinas100g: 2 }])).toEqual({ calorias: 160, proteinas: 6, carboidratos: 22.5, gorduras: 6 });
  });

  it('arredonda cada ingrediente como o servidor sem alterar os valores de referência', () => {
    const item = { ...alimento, gramas: 33.33, proteinas100g: 3.3333 };
    const resultado = totalNutrientes([item, { ...item, chave: 2 }]);
    expect(resultado.proteinas).toBe(2.22);
    expect(item.proteinas100g).toBe(3.3333);
    expect(item.gramas).toBe(33.33);
  });
});
