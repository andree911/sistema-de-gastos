import { Component, OnInit, OnDestroy, computed, inject, signal } from '@angular/core';
import { FormsModule, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { CategoriaAtividade, Atividade, Rotina as RotinaService } from '../../core/rotina';
import { EstudosService, MateriaEstudo } from '../../core/estudos';
import { Select } from '../../shared/select/select';
import { Datepicker } from '../../shared/datepicker/datepicker';
import { ResumoSaudeCard } from '../saude/resumo-saude';

@Component({
  imports: [FormsModule, ReactiveFormsModule, RouterLink, Select, Datepicker, ResumoSaudeCard],
  selector: 'app-rotina', styleUrl: './rotina.css', templateUrl: './rotina.html',
})
export class Rotina implements OnInit, OnDestroy {
  private service = inject(RotinaService);
  private estudos = inject(EstudosService);
  private fb = inject(FormBuilder);
  private consulta?: Subscription;
  private consultaEstudos?: Subscription;
  semana = signal<Atividade[]>([]);
  materias = signal<MateriaEstudo[]>([]);
  erro = signal('');
  erroEstudos = signal('');
  carregando = signal(true);
  falhaCarga = signal(false);
  salvando = signal(false);
  formAberto = signal(false);
  edicao = signal<number | null>(null);
  excluir = signal<Atividade | null>(null);
  dataSelecionada = signal(this.formatarData(new Date()));
  filtro = signal('todas');
  categorias = [
    { valor: 0, nome: 'Pessoal' }, { valor: 1, nome: 'Estudos' },
    { valor: 2, nome: 'Saúde' }, { valor: 3, nome: 'Finanças' },
  ];
  form = this.fb.nonNullable.group({
    titulo: ['', [Validators.required, Validators.maxLength(200), Validators.pattern(/\S/)]],
    categoria: [0, Validators.required],
  });
  atividades = computed(() => this.semana().filter(a => a.data.slice(0, 10) === this.dataSelecionada()));
  concluidas = computed(() => this.atividades().filter(a => a.concluida).length);
  progresso = computed(() => this.atividades().length ? Math.round(this.concluidas() / this.atividades().length * 100) : 0);
  visiveis = computed(() => this.atividades().filter(a => this.filtro() === 'todas' || (this.filtro() === 'concluidas' ? a.concluida : !a.concluida)));
  dias = computed(() => {
    const inicio = this.inicioSemana();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(inicio);
      d.setDate(d.getDate() + i);
      const data = this.formatarData(d);
      const itens = this.semana().filter(a => a.data.slice(0, 10) === data);
      return { data, nome: new Intl.DateTimeFormat('pt-BR', { weekday: 'short' }).format(d),
        dia: d.getDate(), total: itens.length, concluidas: itens.filter(a => a.concluida).length };
    });
  });
  resumoSemana = computed(() => ({ total: this.semana().length, concluidas: this.semana().filter(a => a.concluida).length }));
  estudosPrevistos = computed(() => this.materias().flatMap(m =>
    m.topicos.filter(t => t.dataPrevista === this.dataSelecionada()).map(t => ({ ...t, materia: m.titulo }))));
  ngOnInit(): void {
    this.carregar();
    this.consultaEstudos = this.estudos.planejamento().subscribe({
      next: m => this.materias.set(m),
      error: () => this.erroEstudos.set('Não foi possível carregar os estudos previstos.'),
    });
  }
  ngOnDestroy(): void { this.consulta?.unsubscribe(); this.consultaEstudos?.unsubscribe(); }
  nomeCategoria(c: CategoriaAtividade): string { return this.categorias.find(x => x.valor === c)?.nome ?? 'Pessoal'; }
  tituloDia(): string {
    return new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
      .format(new Date(this.dataSelecionada() + 'T12:00:00'));
  }
  selecionar(data: string): void {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data) || data === this.dataSelecionada()) return;
    this.dataSelecionada.set(data);
    this.formAberto.set(false);
    this.carregar();
  }
  navegar(dias: number): void {
    const d = new Date(this.dataSelecionada() + 'T12:00:00');
    d.setDate(d.getDate() + dias);
    this.selecionar(this.formatarData(d));
  }
  hoje(): void { this.selecionar(this.formatarData(new Date())); }
  abrir(a?: Atividade): void {
    this.edicao.set(a?.id ?? null);
    this.form.reset({ titulo: a?.titulo ?? '', categoria: a?.categoria ?? 0 });
    this.formAberto.set(true);
  }
  onSubmit(): void {
    if (this.form.invalid || this.salvando()) return;
    const v = this.form.getRawValue();
    const antiga = this.atividades().find(a => a.id === this.edicao());
    const dados = { titulo: v.titulo.trim(), categoria: Number(v.categoria),
      data: this.dataSelecionada() + 'T12:00:00Z', concluida: antiga?.concluida ?? false };
    this.salvando.set(true);
    this.erro.set('');
    const req: Observable<unknown> = antiga ? this.service.atualizar(antiga.id, dados) : this.service.criar(dados);
    req.subscribe({
      next: () => { this.salvando.set(false); this.formAberto.set(false); this.carregar(); },
      error: () => { this.salvando.set(false); this.erro.set('Não foi possível salvar a atividade.'); },
    });
  }
  atualizar(a: Atividade, adiar = false): void {
    if (this.salvando()) return;
    const d = new Date(a.data.slice(0, 10) + 'T12:00:00');
    d.setDate(d.getDate() + 1);
    this.salvando.set(true);
    this.service.atualizar(a.id, { titulo: a.titulo, categoria: a.categoria,
      data: adiar ? this.formatarData(d) + 'T12:00:00Z' : a.data,
      concluida: adiar ? false : !a.concluida }).subscribe({
      next: () => { this.salvando.set(false); this.carregar(); },
      error: () => { this.salvando.set(false); this.erro.set('Não foi possível atualizar a atividade.'); },
    });
  }
  remover(): void {
    const a = this.excluir();
    if (!a || this.salvando()) return;
    this.salvando.set(true);
    this.service.deletar(a.id).subscribe({
      next: () => { this.excluir.set(null); this.salvando.set(false); this.carregar(); },
      error: () => { this.salvando.set(false); this.erro.set('Não foi possível excluir a atividade.'); },
    });
  }
  carregar(): void {
    this.consulta?.unsubscribe();
    this.carregando.set(true);
    this.falhaCarga.set(false);
    this.erro.set('');
    this.semana.set([]);
    const inicio = this.inicioSemana();
    const fim = new Date(inicio);
    fim.setDate(fim.getDate() + 6);
    this.consulta = this.service.listarPeriodo(this.formatarData(inicio), this.formatarData(fim)).subscribe({
      next: a => { this.semana.set(a); this.carregando.set(false); },
      error: () => { this.erro.set('Não foi possível carregar a rotina.'); this.falhaCarga.set(true); this.carregando.set(false); },
    });
  }
  private inicioSemana(): Date {
    const d = new Date(this.dataSelecionada() + 'T12:00:00');
    d.setDate(d.getDate() - (d.getDay() + 6) % 7);
    return d;
  }
  private formatarData(d: Date): string {
    return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
  }
}
