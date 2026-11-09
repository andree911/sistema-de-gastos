import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Select } from './select';

describe('Select', () => {
  let component: Select;
  let fixture: ComponentFixture<Select>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Select],
    }).compileComponents();

    fixture = TestBed.createComponent(Select);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('opcoes', [{ valor: 1, nome: 'Baixa' }, { valor: 2, nome: 'Boa' }]);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('permite escolher uma opção usando somente o teclado', async () => {
    let escolhido: number | undefined;
    component.registerOnChange((valor) => escolhido = valor);
    const gatilho: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    gatilho.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    gatilho.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    gatilho.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    await fixture.whenStable();
    expect(escolhido).toBe(2);
    expect(gatilho.getAttribute('aria-expanded')).toBe('false');
    expect(gatilho.textContent).toContain('Boa');
  });

  it('fecha com Escape sem alterar o valor escolhido', async () => {
    component.writeValue(2);
    const gatilho: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    gatilho.click();
    gatilho.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await fixture.whenStable();
    expect(component.valorSelecionado()).toBe(2);
    expect(fixture.nativeElement.querySelector('[role="listbox"]')).toBeNull();
  });

  it('desabilita o gatilho durante a gravação do formulário', async () => {
    component.setDisabledState(true);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('button').disabled).toBe(true);
    component.tecla(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    expect(component.aberto()).toBe(false);
  });
});
