import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { Objetivo, ObjetivosService, TipoObjetivo } from '../../core/objetivos';
import { dataLocal } from '../../core/habitos';
import { Select } from '../../shared/select/select';
import { Datepicker } from '../../shared/datepicker/datepicker';

@Component({
  imports: [ReactiveFormsModule, DecimalPipe, DatePipe, Select, Datepicker],
  templateUrl: './objetivos.html', styleUrls: ['../../shared/planejamento.css'],
  styles: ['main { max-width: 960px; margin: 8rem auto 4rem; padding: 0 1.25rem; } .objetivo { background: var(--cor-card); border: 1px solid var(--cor-borda); border-radius: 12px; padding: 1.25rem; } .resultado { font-size: 1.25rem; color: var(--cor-texto); }'],
})
export class Objetivos implements OnInit, OnDestroy {
  private service = inject(ObjetivosService); private fb = inject(FormBuilder); private consulta?: Subscription;
  objetivos = signal<Objetivo[]>([]); carregando = signal(true); erro = signal(''); salvando = signal(false);
  aberto = signal(false); edicao = signal<number | null>(null); exclusao = signal<Objetivo | null>(null);
  tipos = [{valor:'manual',nome:'Progresso manual'},{valor:'estudo',nome:'Tempo de estudo (minutos)'},{valor:'habitos',nome:'Conclusões de hábitos'},{valor:'exercicio',nome:'Tempo de exercício (minutos)'},{valor:'economia',nome:'Saldo de receitas e gastos'}];
  moedas = [{valor:0,nome:'Real (BRL)'},{valor:1,nome:'Dólar (USD)'},{valor:2,nome:'Euro (EUR)'}];
  form = this.fb.nonNullable.group({titulo:['',[Validators.required,Validators.maxLength(200),Validators.pattern(/\S/)]],tipo:['manual' as TipoObjetivo,Validators.required],meta:[1,[Validators.required,Validators.min(.01)]],inicio:[dataLocal(),Validators.required],fim:[dataLocal(),Validators.required],moeda:[0],valorManual:[0,[Validators.required,Validators.min(0)]]});
  tipoSelecionado = toSignal(this.form.controls.tipo.valueChanges, { initialValue: this.form.controls.tipo.value });
  ngOnInit(): void { this.carregar(); }
  ngOnDestroy(): void { this.consulta?.unsubscribe(); }
  carregar(): void { this.consulta?.unsubscribe(); this.carregando.set(true); this.erro.set(''); this.consulta=this.service.listar().subscribe({next:o=>{this.objetivos.set(o);this.carregando.set(false);},error:()=>{this.erro.set('Não foi possível carregar os objetivos. Tente novamente.');this.carregando.set(false);}}); }
  abrir(o?: Objetivo): void { this.edicao.set(o?.id ?? null); this.form.reset(o ? {titulo:o.titulo,tipo:o.tipo,meta:o.meta,inicio:o.inicio,fim:o.fim,moeda:o.moeda,valorManual:o.valorManual} : {titulo:'',tipo:'manual',meta:1,inicio:dataLocal(),fim:dataLocal(),moeda:0,valorManual:0}); this.aberto.set(true); }
  salvar(): void {
    if(this.form.invalid || this.salvando()) return;
    const v=this.form.getRawValue(); if(v.fim<v.inicio){this.erro.set('A data final deve ser igual ou posterior à inicial.');return;}
    this.executar(this.service.salvar({...v,titulo:v.titulo.trim(),meta:Number(v.meta),moeda:Number(v.moeda),valorManual:v.tipo==='manual'?Number(v.valorManual):0},this.edicao() ?? undefined),()=>this.aberto.set(false));
  }
  excluir(): void { const o=this.exclusao(); if(o) this.executar(this.service.excluir(o.id),()=>this.exclusao.set(null)); }
  nomeTipo(o: Objetivo): string { return this.tipos.find(t=>t.valor===o.tipo)?.nome ?? o.tipo; }
  estado(o: Objetivo): string { return o.atual>=o.meta ? 'Meta atingida' : o.inicio>dataLocal() ? 'Ainda não começou' : o.fim<dataLocal() ? 'Período encerrado' : 'Em andamento'; }
  private executar(req:import('rxjs').Observable<unknown>,depois:()=>void):void{if(this.salvando())return;this.salvando.set(true);this.erro.set('');req.subscribe({next:()=>{this.salvando.set(false);depois();this.carregar();},error:()=>{this.salvando.set(false);this.erro.set('Não foi possível salvar. Confira os valores e o período e tente novamente.');}});}
}
