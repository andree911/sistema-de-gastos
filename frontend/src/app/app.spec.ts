import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { Router, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { App } from './app';

@Component({ template: '' })
class PaginaTeste {}

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([
          { path: 'login', component: PaginaTeste },
          { path: 'registro', component: PaginaTeste },
          { path: 'rotina', component: PaginaTeste },
        ]),
        provideHttpClient(), provideHttpClientTesting(),
      ],
    })
      .compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('renderiza as rotas e mostra a navegação somente fora do login e registro', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/login');
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('router-outlet')).not.toBeNull();
    expect(compiled.querySelector('app-navbar')).toBeNull();
    await router.navigateByUrl('/rotina');
    await fixture.whenStable();
    expect(compiled.querySelector('app-navbar')).not.toBeNull();
    await router.navigateByUrl('/registro');
    await fixture.whenStable();
    expect(compiled.querySelector('app-navbar')).toBeNull();
  });
});
