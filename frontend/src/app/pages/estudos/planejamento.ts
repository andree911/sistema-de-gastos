import { Component, EventEmitter, Input, OnChanges, Output, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin, Observable } from 'rxjs';
import { EstudosService, MateriaEstudo, PlanoEstudo, TemaCatalogo, TopicoEstudo } from '../../core/estudos';
import { Select } from '../../shared/select/select';
import { Datepicker } from '../../shared/datepicker/datepicker';

@Component({
  selector: 'app-planejamento-estudo', imports: [FormsModule, Select, Datepicker],
  templateUrl: './planejamento.html', styleUrl: './planejamento.css',
})
export class PlanejamentoEstudo implements OnChanges {
  private service = inject(EstudosService);
  @Input() atualizacao = 0;
  @Output() estudar = new EventEmitter<{ planoId: number; topicoId: number; titulo: string }>();
  planos = signal<PlanoEstudo[]>([]); materias = signal<MateriaEstudo[]>([]);
  carregando = signal(true); salvando = signal(false); erro = signal('');
  catalogoMateriaId = signal<number | null>(null); buscaCatalogo = ''; resultadosCatalogo = signal<TemaCatalogo[]>([]);
  carregandoCatalogo = signal(false); erroCatalogo = signal(''); subtemasCatalogo = signal<Record<string, TemaCatalogo[]>>({});
  subtemasAbertos = signal<Set<string>>(new Set()); carregandoSubtemas = signal<string | null>(null);
  planoId: number | null = null; novaMateria = ''; materiaEdicao: number | null = null;
  topicoId: number | undefined; titulo = ''; status = 'a-estudar'; data = '';
  exclusao = signal<{ tipo: 'materia' | 'topico'; id: number } | null>(null);
  statusOpcoes = [{ valor: 'a-estudar', nome: 'A estudar' }, { valor: 'em-andamento', nome: 'Em andamento' }, { valor: 'concluido', nome: 'Concluído' }];
  ngOnChanges(): void { this.carregar(); }
  carregar(): void {
    this.carregando.set(true); this.erro.set('');
    forkJoin({ planos: this.service.listarPlanos(), materias: this.service.planejamento() }).subscribe({
      next: ({ planos, materias }) => {
        this.planos.set(planos); this.materias.set(materias);
        if (!planos.some(p => p.id === this.planoId)) this.planoId = planos[0]?.id ?? null;
        this.carregando.set(false);
      }, error: () => { this.erro.set('Não foi possível carregar o planejamento.'); this.carregando.set(false); },
    });
  }
  get opcoesPlanos() { return this.planos().map(p => ({ valor: p.id, nome: p.titulo })); }
  get materiasPlano() { return this.materias().filter(m => m.planoEstudoId === this.planoId); }
  get topicos() { return this.materiasPlano.flatMap(m => m.topicos); }
  get concluidos() { return this.topicos.filter(t => t.status === 'concluido').length; }
  get minutos() { return this.topicos.reduce((n, t) => n + t.minutos, 0); }
  mudarPlano(): void { this.materiaEdicao = null; this.novaMateria = ''; }
  alternarCatalogo(materiaId: number): void {
    this.catalogoMateriaId.set(this.catalogoMateriaId() === materiaId ? null : materiaId);
    this.buscaCatalogo = ''; this.resultadosCatalogo.set([]); this.erroCatalogo.set('');
  }
  buscarCatalogo(): void {
    const busca = this.buscaCatalogo.trim();
    if (busca.length < 2 || busca.length > 100 || this.carregandoCatalogo()) return;
    this.carregandoCatalogo.set(true); this.erroCatalogo.set(''); this.resultadosCatalogo.set([]);
    this.service.buscarTemas(busca).subscribe({
      next: temas => { this.resultadosCatalogo.set(temas); this.carregandoCatalogo.set(false); },
      error: () => { this.erroCatalogo.set('Não foi possível consultar o catálogo. Você ainda pode adicionar um tópico manualmente.'); this.carregandoCatalogo.set(false); },
    });
  }
  alternarSubtemas(tema: TemaCatalogo): void {
    if (this.subtemasCatalogo()[tema.codigo] !== undefined) {
      this.subtemasAbertos.update(abertos => { const novos = new Set(abertos); novos.has(tema.codigo) ? novos.delete(tema.codigo) : novos.add(tema.codigo); return novos; });
      return;
    }
    this.carregandoSubtemas.set(tema.codigo);
    this.service.subtemas(tema.codigo).subscribe({
      next: subtemas => {
        this.subtemasCatalogo.update(mapa => ({ ...mapa, [tema.codigo]: subtemas }));
        this.subtemasAbertos.update(abertos => new Set(abertos).add(tema.codigo)); this.carregandoSubtemas.set(null);
      }, error: () => { this.erroCatalogo.set('Não foi possível carregar os subtemas. Tente novamente.'); this.carregandoSubtemas.set(null); },
    });
  }
  temaAdicionado(materia: MateriaEstudo, tema: TemaCatalogo): boolean {
    return materia.topicos.some(topico => topico.fonteCatalogo === 'unesco' && topico.codigoCatalogo === tema.codigo);
  }
  adicionarTemaCatalogo(materia: MateriaEstudo, tema: TemaCatalogo): void {
    if (this.temaAdicionado(materia, tema) || this.salvando()) return;
    this.executar(this.service.salvarTopico(materia.id, {
      titulo: tema.titulo, status: 'a-estudar', dataPrevista: null, fonteCatalogo: 'unesco', codigoCatalogo: tema.codigo,
    }));
  }
  executar(request: Observable<unknown>, fim?: () => void): void {
    if (this.salvando()) return;
    this.salvando.set(true); this.erro.set('');
    request.subscribe({ next: () => { this.salvando.set(false); fim?.(); this.carregar(); },
      error: () => { this.salvando.set(false); this.erro.set('Não foi possível salvar. Seus dados do formulário foram mantidos.'); } });
  }
  adicionarMateria(): void {
    if (!this.planoId || !this.novaMateria.trim()) return;
    this.executar(this.service.criarMateria(this.novaMateria.trim(), this.planoId), () => this.novaMateria = '');
  }
  editar(materiaId: number, topico?: TopicoEstudo): void {
    this.materiaEdicao = materiaId; this.topicoId = topico?.id;
    this.titulo = topico?.titulo ?? ''; this.status = topico?.status ?? 'a-estudar'; this.data = topico?.dataPrevista ?? '';
  }
  salvar(): void {
    if (!this.materiaEdicao || !this.titulo.trim()) return;
    this.executar(this.service.salvarTopico(this.materiaEdicao, { titulo: this.titulo.trim(), status: this.status, dataPrevista: this.data || null }, this.topicoId), () => this.materiaEdicao = null);
  }
  alterarStatus(materia: MateriaEstudo, topico: TopicoEstudo, status: string): void {
    this.executar(this.service.salvarTopico(materia.id, { titulo: topico.titulo, status, dataPrevista: topico.dataPrevista }, topico.id));
  }
  excluir(): void {
    const alvo = this.exclusao(); if (!alvo) return;
    this.executar(alvo.tipo === 'materia' ? this.service.excluirMateria(alvo.id) : this.service.excluirTopico(alvo.id), () => this.exclusao.set(null));
  }
  formatarData(data: string): string { return data.split('-').reverse().join('/'); }
}
