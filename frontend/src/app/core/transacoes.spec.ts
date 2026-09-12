import { TestBed } from '@angular/core/testing';
import { Transacoes } from './transacoes';

describe('Transacoes', () => {
  let service: Transacoes;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Transacoes);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
