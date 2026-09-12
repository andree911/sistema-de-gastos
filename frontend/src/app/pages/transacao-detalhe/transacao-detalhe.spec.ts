import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TransacaoDetalhe } from './transacao-detalhe';

describe('TransacaoDetalhe', () => {
  let component: TransacaoDetalhe;
  let fixture: ComponentFixture<TransacaoDetalhe>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TransacaoDetalhe],
    }).compileComponents();

    fixture = TestBed.createComponent(TransacaoDetalhe);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
