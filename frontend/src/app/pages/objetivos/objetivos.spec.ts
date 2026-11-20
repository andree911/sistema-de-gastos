import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Objetivos } from './objetivos';
import { ObjetivosService } from '../../core/objetivos';

describe('Objetivos',()=>{
  function criar(){
    const service={listar:vi.fn(()=>of([])),salvar:vi.fn(()=>of({})),excluir:vi.fn(()=>of({}))};
    TestBed.configureTestingModule({providers:[{provide:ObjetivosService,useValue:service}]});
    return {c:TestBed.runInInjectionContext(()=>new Objetivos()),service};
  }
  it('envia progresso manual e preserva as datas inclusivas',()=>{
    const {c,service}=criar();c.form.setValue({titulo:'Ler livros',tipo:'manual',meta:10,inicio:'2026-11-01',fim:'2026-11-30',moeda:0,valorManual:3});
    c.salvar();expect(service.salvar).toHaveBeenCalledWith(expect.objectContaining({valorManual:3,inicio:'2026-11-01',fim:'2026-11-30'}),undefined);
  });
  it('não envia progresso manual para objetivos calculados dos registros',()=>{
    const {c,service}=criar();c.form.setValue({titulo:'Estudar',tipo:'estudo',meta:300,inicio:'2026-11-01',fim:'2026-11-30',moeda:0,valorManual:90});
    c.salvar();expect(service.salvar).toHaveBeenCalledWith(expect.objectContaining({tipo:'estudo',meta:300,valorManual:0}),undefined);
  });
  it('rejeita período invertido antes de enviar a API',()=>{
    const {c,service}=criar();c.form.patchValue({titulo:'Meta',inicio:'2026-11-30',fim:'2026-11-01'});c.salvar();expect(service.salvar).not.toHaveBeenCalled();expect(c.erro()).toContain('data final');
  });
  it('mostra editor manual e explica o cálculo automático ao trocar o tipo',()=>{
    const service={listar:()=>of([]),salvar:()=>of({}),excluir:()=>of({})};
    TestBed.configureTestingModule({providers:[{provide:ObjetivosService,useValue:service}]});
    const fixture=TestBed.createComponent(Objetivos);fixture.detectChanges();fixture.componentInstance.abrir();fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#objetivo-atual')).not.toBeNull();
    fixture.componentInstance.form.controls.tipo.setValue('estudo');fixture.changeDetectorRef.markForCheck();fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#objetivo-atual')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('O progresso é calculado automaticamente');
  });
});
