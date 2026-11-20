import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Login } from './login';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { Auth } from '../../core/auth';

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;
  let login: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    login = vi.fn().mockReturnValue(of({}));
    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [provideRouter([]), { provide: Auth, useValue: { login } }],
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('abre a rotina após autenticar com dados válidos', () => {
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    component.form.setValue({ email: 'teste@example.com', senha: 'senha-teste' });
    component.onSubmit();
    expect(login).toHaveBeenCalledWith({ email: 'teste@example.com', senha: 'senha-teste' });
    expect(navegar).toHaveBeenCalledWith(['/rotina']);
  });

  it('mantém o usuário no login quando a autenticação falha', () => {
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    login.mockReturnValue(throwError(() => new Error('credenciais inválidas')));
    component.form.setValue({ email: 'teste@example.com', senha: 'senha-teste' });
    component.onSubmit();
    expect(component.erro).not.toBe('');
    expect(navegar).not.toHaveBeenCalled();
  });
});
