import { Component, Input, OnChanges, OnDestroy, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subscription, forkJoin, of, catchError } from 'rxjs';
import { API_URL } from '../../core/api.config';
import { FinancasService } from '../../core/financas';
import { Objetivo, ObjetivosService } from '../../core/objetivos';
import { Moeda } from '../../core/transacoes';

@Component({
  selector: 'app-panorama-dia', imports: [RouterLink, CurrencyPipe],
  template: `<section aria-labelledby="panorama-titulo">
    <header><h2 id="panorama-titulo">Seu dia em registros</h2><button type="button" (click)="carregar()" [disabled]="carregando()">Atualizar resumo</button></header>
    @if (carregando()) { <p role="status">Carregando resumos...</p> }
    @else {
      <div class="panorama">
        <div><h3>Estudos realizados</h3>@if (estudos(); as e) { <p><strong>{{ e.minutos }} min</strong> em {{ e.sessoes }} sessões</p> } @else { <p class="erro" role="alert">Não foi possível carregar os estudos.</p> }<a routerLink="/estudos">Registrar estudo</a></div>
        <div><h3>Finanças nesta data</h3>@for (f of financas(); track f.codigo) { @if (f.erro) { <p class="erro" role="alert">Não foi possível carregar {{ f.codigo }}.</p> } @else if (f.total) { <p>{{ f.codigo }}: receitas {{ f.receitas | currency:f.codigo }} · gastos {{ f.gastos | currency:f.codigo }}</p> } }@if (semMovimentos()) { <p>Nenhuma movimentação registrada.</p> }<a routerLink="/financas">Ver finanças do mês</a></div>
      </div>
      <div class="objetivos"><h3>Objetivos neste período</h3>@if (erroObjetivos()) { <p class="erro" role="alert">Não foi possível carregar os objetivos.</p> } @else { @for (o of objetivos(); track o.id) { <div class="meta"><span>{{ o.titulo }}</span><progress max="100" [value]="o.progresso" [attr.aria-label]="'Progresso de ' + o.titulo"></progress><small>{{ o.atual }} / {{ o.meta }} {{ o.unidade }}</small></div> } @empty { <p>Crie um objetivo para acompanhar seus registros ao longo dos dias.</p> } }<a routerLink="/objetivos">Gerenciar objetivos</a></div>
    }
  </section>`,
  styleUrls: ['../../shared/planejamento.css'],
  styles: ['section { margin-top: 1.5rem; padding: 1.2rem; border: 1px solid var(--cor-borda); border-radius: 14px; background: var(--cor-card); } .panorama { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; } .objetivos { margin-top: 1.5rem; padding-top: 1.2rem; border-top: 1px solid var(--cor-borda); } .meta { margin: 1rem 0; } @media(max-width:640px) { .panorama { grid-template-columns: 1fr; } }'],
})
export class PanoramaDia implements OnChanges, OnDestroy {
  @Input({ required: true }) data = ''; @Input() revisao = 0;
  private http = inject(HttpClient); private financeiro = inject(FinancasService); private metas = inject(ObjetivosService); private consulta?: Subscription;
  estudos = signal<{minutos:number;sessoes:number} | null>(null);
  financas = signal<{codigo:string;receitas:number;gastos:number;total:number;erro:boolean}[]>([]);
  objetivos = signal<Objetivo[]>([]); erroObjetivos = signal(false); carregando = signal(true);
  ngOnChanges(): void { this.carregar(); }
  ngOnDestroy(): void { this.consulta?.unsubscribe(); }
  semMovimentos(): boolean { return this.financas().length === 3 && this.financas().every(f => !f.erro && !f.total); }
  carregar(): void {
    this.consulta?.unsubscribe(); this.carregando.set(true);
    this.consulta = forkJoin({
      estudos:this.http.get<{minutos:number;sessoes:number}>(API_URL + '/estudos/resumo-dia',{params:{data:this.data}}).pipe(catchError(()=>of(null))),
      objetivos:this.metas.listar().pipe(catchError(()=>of(null))),
      financas:forkJoin([Moeda.BRL,Moeda.USD,Moeda.EUR].map(m=>this.financeiro.resumo(this.data.slice(0,7),m).pipe(catchError(()=>of(null))))),
    }).subscribe(r=>{
      this.estudos.set(r.estudos);this.erroObjetivos.set(r.objetivos===null);this.objetivos.set((r.objetivos??[]).filter(o=>o.inicio<=this.data && o.fim>=this.data));
      this.financas.set(r.financas.map((f,m)=>{const t=f?.transacoes.filter(t=>t.data.slice(0,10)===this.data)??[];return{codigo:Moeda[m],receitas:t.filter(t=>t.tipo===1).reduce((s,t)=>s+t.valor,0),gastos:t.filter(t=>t.tipo===0).reduce((s,t)=>s+t.valor,0),total:t.length,erro:f===null};}));this.carregando.set(false);
    });
  }
}
