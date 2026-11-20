import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { PanoramaDia } from './panorama-dia';

describe('Resumo Meu dia',()=>{
  function criar(){
    TestBed.configureTestingModule({providers:[provideHttpClient(),provideHttpClientTesting(),provideRouter([])]});
    const fixture=TestBed.createComponent(PanoramaDia);fixture.componentRef.setInput('data','2026-11-09');fixture.detectChanges();
    return {fixture,c:fixture.componentInstance,http:TestBed.inject(HttpTestingController)};
  }
  it('separa as moedas e considera somente as movimentações da data selecionada',()=>{
    const {fixture,c,http}=criar();
    http.expectOne(r=>r.url.endsWith('/estudos/resumo-dia')).flush({minutos:120,sessoes:2});
    http.expectOne(r=>r.url.endsWith('/objetivos')).flush([]);
    const consultas=http.match(r=>r.url.endsWith('/financas/resumo'));
    consultas.forEach(r=>r.flush({mes:'2026-11',moeda:Number(r.request.params.get('moeda')),receitas:999,gastos:999,saldo:0,categorias:[],transacoes:r.request.params.get('moeda')==='0'?[{data:'2026-11-09T12:00:00Z',tipo:0,valor:25},{data:'2026-11-08T12:00:00Z',tipo:1,valor:100}]:[]}));
    fixture.detectChanges();expect(c.financas()[0]).toMatchObject({codigo:'BRL',gastos:25,receitas:0,total:1});expect(c.financas()[1].total).toBe(0);
    expect(fixture.nativeElement.textContent).toContain('120 min');http.verify();
  });
  it('mantém os estudos visíveis quando uma consulta financeira falha',()=>{
    const {fixture,c,http}=criar();
    http.expectOne(r=>r.url.endsWith('/estudos/resumo-dia')).flush({minutos:60,sessoes:1});
    http.expectOne(r=>r.url.endsWith('/objetivos')).flush([]);
    http.match(r=>r.url.endsWith('/financas/resumo')).forEach((r,i)=>i===0?r.flush('indisponível',{status:503,statusText:'Unavailable'}):r.flush({transacoes:[]}));
    fixture.detectChanges();expect(c.estudos()?.minutos).toBe(60);expect(c.financas()[0].erro).toBe(true);expect(c.semMovimentos()).toBe(false);expect(fixture.nativeElement.querySelector('[role="alert"]')).not.toBeNull();http.verify();
  });
});
