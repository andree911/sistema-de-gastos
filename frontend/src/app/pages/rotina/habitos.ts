import { Component, Input, Output, EventEmitter, OnChanges, OnDestroy, inject, signal, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Habito, HabitosService, dataLocal } from '../../core/habitos';
import { Select } from '../../shared/select/select';
import { Datepicker } from '../../shared/datepicker/datepicker';

@Component({
  selector: 'app-habitos', imports: [ReactiveFormsModule, Select, Datepicker],
  templateUrl: './habitos.html', styleUrls: ['../../shared/planejamento.css'],
  styles: ['section { margin-top: 1.5rem; padding: 1.2rem; background: var(--cor-card); border: 1px solid var(--cor-borda); border-radius: 14px; } details { margin-top: 1.2rem; } summary { cursor: pointer; color: var(--cor-texto-suave); }'],
})
export class Habitos implements OnChanges, OnDestroy {
  @Input({ required: true }) data = '';
  @Output() alterado = new EventEmitter<void>();
  private service = inject(HabitosService); private fb = inject(FormBuilder); private consulta?: Subscription;
  habitos = signal<Habito[]>([]); carregando = signal(true); erro = signal(''); salvando = signal(false);
  aberto = signal(false); edicao = signal<number | null>(null); exclusao = signal<Habito | null>(null);
  diasSelecionados = signal<number[]>([1, 2, 3, 4, 5]);
  dias = [{valor:1,nome:'Seg'},{valor:2,nome:'Ter'},{valor:3,nome:'Qua'},{valor:4,nome:'Qui'},{valor:5,nome:'Sex'},{valor:6,nome:'Sáb'},{valor:0,nome:'Dom'}];
  categorias = [{valor:0,nome:'Pessoal'},{valor:1,nome:'Estudos'},{valor:2,nome:'Saúde'},{valor:3,nome:'Finanças'}];
  form = this.fb.nonNullable.group({ titulo: ['', [Validators.required, Validators.maxLength(200), Validators.pattern(/\S/)]], categoria: [0], inicio: [dataLocal(), Validators.required], fim: [''] });
  dia = computed(() => this.habitos().flatMap(h => h.ocorrencias.filter(o => o.data === this.data).map(o => ({ habito: h, ...o }))));
  concluidas = computed(() => this.dia().filter(o => o.concluida).length);
  gerenciaveis = computed(() => this.habitos().filter(h => !h.arquivado));
  ngOnChanges(): void { this.carregar(); }
  ngOnDestroy(): void { this.consulta?.unsubscribe(); }
  carregar(): void {
    this.consulta?.unsubscribe(); this.carregando.set(true); this.erro.set(''); this.habitos.set([]);
    const inicio = new Date(this.data + 'T12:00:00'); inicio.setDate(inicio.getDate() - (inicio.getDay() + 6) % 7);
    const fim = new Date(inicio); fim.setDate(fim.getDate() + 6);
    this.consulta = this.service.listar(dataLocal(inicio), dataLocal(fim)).subscribe({ next: h => { this.habitos.set(h); this.carregando.set(false); }, error: () => { this.erro.set('Não foi possível carregar os hábitos. Tente novamente.'); this.carregando.set(false); } });
  }
  abrir(h?: Habito): void {
    this.edicao.set(h?.id ?? null);
    this.form.reset({titulo:h?.titulo ?? '',categoria:h?.categoria ?? 0,inicio:h?.inicio ?? this.data,fim:h?.fim ?? ''});
    for (const campo of [this.form.controls.inicio, this.form.controls.fim]) h ? campo.disable() : campo.enable();
    this.diasSelecionados.set(h ? [...h.diasSemana] : [1,2,3,4,5]); this.aberto.set(true);
  }
  alternarDia(dia: number): void { this.diasSelecionados.update(dias => dias.includes(dia) ? dias.filter(d => d !== dia) : [...dias,dia]); }
  salvar(): void {
    if (this.form.invalid || !this.diasSelecionados().length || this.salvando()) return;
    const v = this.form.getRawValue();
    if (v.fim && v.fim < v.inicio) { this.erro.set('A data final deve ser igual ou posterior à inicial.'); return; }
    this.executar(this.service.salvar({...v,titulo:v.titulo.trim(),categoria:Number(v.categoria),fim:v.fim || null,diasSemana:this.diasSelecionados()},this.edicao() ?? undefined), () => this.aberto.set(false));
  }
  futuro(): boolean { return this.data > dataLocal(); }
  concluir(h: Habito, concluida: boolean): void { if (!this.futuro()) this.executar(this.service.concluir(h.id,this.data,concluida)); }
  pausar(h: Habito): void { this.executar(this.service.pausar(h.id,!h.pausado,dataLocal())); }
  arquivar(): void { const h=this.exclusao(); if (h) this.executar(this.service.arquivar(h.id),() => this.exclusao.set(null)); }
  nomesDias(h: Habito): string { return this.dias.filter(d => h.diasSemana.includes(d.valor)).map(d => d.nome).join(', '); }
  private executar(req: import('rxjs').Observable<unknown>, depois = () => {}): void {
    if (this.salvando()) return; this.salvando.set(true); this.erro.set('');
    req.subscribe({ next: () => { this.salvando.set(false); depois(); this.carregar(); this.alterado.emit(); }, error: () => { this.salvando.set(false); this.erro.set('Não foi possível salvar o hábito. Confira as datas e tente novamente.'); } });
  }
}
