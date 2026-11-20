import { TestBed } from '@angular/core/testing';
import { of, Subject } from 'rxjs';
import { Habitos } from './habitos';
import { Habito, HabitosService } from '../../core/habitos';

describe('Hábitos na rotina', () => {
  const habito: Habito = {id:1,titulo:'Ler',categoria:1,diasSemana:[1,3,5],inicio:'2026-01-01',fim:null,pausado:false,arquivado:false,ocorrencias:[{data:'2026-11-09',concluida:false}]};
  function criar() {
    const service = {listar:vi.fn(()=>of([habito])),salvar:vi.fn(()=>of({})),concluir:vi.fn(()=>of({})),pausar:vi.fn(()=>of({})),arquivar:vi.fn(()=>of({}))};
    TestBed.configureTestingModule({providers:[{provide:HabitosService,useValue:service}]});
    const fixture=TestBed.createComponent(Habitos);fixture.componentRef.setInput('data','2026-11-09');fixture.detectChanges();
    return {fixture,c:fixture.componentInstance,service};
  }
  it('renderiza somente as ocorrências da data escolhida e conclui esse dia',()=>{
    const {fixture,c,service}=criar();
    expect(c.dia()).toHaveLength(1);
    const botao=fixture.nativeElement.querySelector('button[aria-label="Concluir Ler"]') as HTMLButtonElement;
    botao.click(); expect(service.concluir).toHaveBeenCalledWith(1,'2026-11-09',true);
    fixture.componentRef.setInput('data','2026-11-10');fixture.detectChanges();expect(c.dia()).toHaveLength(0);
  });
  it('mantém o calendário original ao editar e permite escolher dias ao criar',()=>{
    const {c}=criar();c.abrir(habito);expect(c.form.controls.inicio.disabled).toBe(true);expect(c.form.getRawValue().inicio).toBe(habito.inicio);
    c.abrir();expect(c.form.controls.inicio.enabled).toBe(true);c.diasSelecionados.set([]);c.salvar();expect(c.salvando()).toBe(false);
  });
  it('cancela a consulta anterior ao mudar de semana',()=>{
    const {c,service}=criar();const antiga=new Subject<Habito[]>();service.listar.mockReturnValueOnce(antiga);
    c.carregar();c.data='2026-11-16';c.carregar();antiga.next([{...habito,titulo:'Resposta antiga'}]);expect(c.habitos()[0].titulo).toBe('Ler');
  });
  it('bloqueia conclusão em data futura',()=>{
    const {c,service}=criar();c.data='2099-01-01';c.concluir(habito,true);expect(service.concluir).not.toHaveBeenCalled();
  });
});
