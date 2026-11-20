import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Registro } from './registro';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { Auth } from '../../core/auth';

describe('Registro', () => {
  let component: Registro;
  let fixture: ComponentFixture<Registro>;
  let registrar: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    registrar = vi.fn().mockReturnValue(of({}));
    await TestBed.configureTestingModule({
      imports: [Registro],
      providers: [provideRouter([]), { provide: Auth, useValue: { register: registrar } }],
    }).compileComponents();

    fixture = TestBed.createComponent(Registro);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('abre a rotina após criar a conta', () => {
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const dados = { nome: 'Teste', email: 'teste@example.com', senha: 'senha-teste' };
    component.form.setValue(dados);
    component.onSubmit();
    expect(registrar).toHaveBeenCalledWith(dados);
    expect(navegar).toHaveBeenCalledWith(['/rotina']);
  });

  it('informa falha de cadastro sem navegar', () => {
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    registrar.mockReturnValue(throwError(() => new Error('falha no cadastro')));
    component.form.setValue({ nome: 'Teste', email: 'teste@example.com', senha: 'senha-teste' });
    component.onSubmit();
    expect(component.erro).not.toBe('');
    expect(navegar).not.toHaveBeenCalled();
  });
});
