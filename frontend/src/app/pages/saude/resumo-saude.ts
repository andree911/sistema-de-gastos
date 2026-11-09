import { Component, Input, OnChanges, OnDestroy, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { ResumoSaude, SaudeService } from '../../core/saude';

@Component({
  selector: 'app-resumo-saude', imports: [RouterLink],
  template: `<section><header><h2>Saúde no dia</h2><a routerLink="/saude" [queryParams]="{ data }">Abrir diário de saúde</a></header>
    @if (carregando()) { <p>Carregando saúde...</p> }
    @else if (erro()) { <p>{{ erro() }}</p><button type="button" (click)="carregar()">Tentar novamente</button> }
    @else if (resumo(); as r) {
      @if (r.temRegistro) { <div><span><strong>{{ r.sonoMinutos === null ? '—' : (r.sonoMinutos / 60).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + ' h' }}</strong>Sono</span><span><strong>{{ r.aguaMl }} ml</strong>Água</span><span><strong>{{ r.exercicioMinutos }} min</strong>Exercício</span><span><strong>{{ r.refeicoes }}</strong>Refeições</span></div> }
      @else { <p>Como foi seu dia? Registre sono, água, refeições e exercícios no diário de saúde.</p> }
    }</section>`,
  styles: [`section{margin-top:1.5rem;padding:1.2rem;background:var(--cor-card);border:1px solid var(--cor-borda);border-radius:14px}header{display:flex;justify-content:space-between;gap:1rem;align-items:center}h2{font-size:1.1rem;margin:0}a{color:var(--cor-primaria);font-size:.8rem}p{color:var(--cor-texto-suave);font-size:.85rem;line-height:1.5}section>div{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:1rem;margin-top:1rem}span{display:grid;gap:.4rem;color:var(--cor-texto-suave);font-size:.75rem}strong{color:var(--cor-texto);font-size:1.1rem}button{background:transparent;color:var(--cor-texto);border:1px solid var(--cor-borda-input);border-radius:8px;padding:.5rem}@media(max-width:600px){header{align-items:start;flex-direction:column}section>div{grid-template-columns:1fr 1fr}}`],
})
export class ResumoSaudeCard implements OnChanges, OnDestroy {
  @Input({ required: true }) data = '';
  private service = inject(SaudeService); private consulta?: Subscription;
  resumo = signal<ResumoSaude | null>(null); erro = signal(''); carregando = signal(true);
  ngOnChanges(): void { this.carregar(); }
  ngOnDestroy(): void { this.consulta?.unsubscribe(); }
  carregar(): void {
    this.consulta?.unsubscribe(); this.carregando.set(true); this.erro.set('');
    this.consulta = this.service.dia(this.data).subscribe({ next: d => { this.resumo.set(d.resumo); this.carregando.set(false); },
      error: () => { this.resumo.set(null); this.erro.set('Não foi possível carregar o resumo de saúde.'); this.carregando.set(false); } });
  }
}
