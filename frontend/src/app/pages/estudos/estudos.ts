import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, forkJoin, of } from 'rxjs';
import { CURSOS_ESTUDO, LicaoEstudo } from '../../core/conteudo-estudo';
import { EstudosService, LicaoConcluida, PlanoEstudo, PlanoEstudoRequest, SessaoEstudo } from '../../core/estudos';

@Component({
  imports: [CommonModule, ReactiveFormsModule],
  selector: 'app-estudos',
  styleUrl: './estudos.css',
  templateUrl: './estudos.html',
})
export class Estudos implements OnInit {
  private service = inject(EstudosService);
  private fb = inject(FormBuilder);

  curso = CURSOS_ESTUDO[0];
  cursos = CURSOS_ESTUDO;
  licaoSelecionada = signal<LicaoEstudo>(this.curso.licoes[0]);
  planos = signal<PlanoEstudo[]>([]);
  sessoes = signal<SessaoEstudo[]>([]);
  licoesConcluidas = signal<LicaoConcluida[]>([]);
  erro = signal('');
  carregando = signal(true);
  planoAberto = signal(false);
  planoEmEdicao = signal<number | null>(null);
  removerPendente = signal<{ tipo: 'plano' | 'sessao'; id: number } | null>(null);

  planoForm = this.fb.group({
    titulo: ['', Validators.required],
    tema: ['Aprender a aprender', Validators.required],
    objetivo: [''],
    cursoSlug: [this.curso.slug],
    metaSessoesSemanais: [3, [Validators.required, Validators.min(1), Validators.max(14)]],
  });

  sessaoForm = this.fb.group({
    planoEstudoId: [''],
    duracaoMinutos: [25, [Validators.required, Validators.min(1), Validators.max(1440)]],
    data: [this.dataHoje(), Validators.required],
    observacoes: [''],
  });

  totalSessoesSemana = computed(() => this.sessoes().filter((sessao) => this.estaNaSemana(sessao.data)).length);
  totalMinutosSemana = computed(() =>
    this.sessoes()
      .filter((sessao) => this.estaNaSemana(sessao.data))
      .reduce((total, sessao) => total + sessao.duracaoMinutos, 0),
  );
  progressoCurso = computed(() =>
    Math.round((this.curso.licoes.filter((licao) => this.licaoConcluida(licao.slug)).length / this.curso.licoes.length) * 100),
  );

  ngOnInit(): void {
    this.carregar();
  }

  selecionarLicao(licao: LicaoEstudo): void {
    this.licaoSelecionada.set(licao);
  }

  licaoConcluida(slug: string): boolean {
    return this.licoesConcluidas().some((item) => item.cursoSlug === this.curso.slug && item.licaoSlug === slug);
  }

  alternarConclusaoLicao(licao: LicaoEstudo): void {
    const concluida = this.licaoConcluida(licao.slug);
    const request = concluida
      ? this.service.reabrirLicao(this.curso.slug, licao.slug)
      : this.service.concluirLicao(this.curso.slug, licao.slug);

    request.subscribe({
      next: () => this.carregar(),
      error: () => this.erro.set('Não foi possível atualizar o progresso da aula.'),
    });
  }

  abrirNovoPlano(): void {
    this.planoEmEdicao.set(null);
    this.planoForm.reset({ titulo: '', tema: 'Aprender a aprender', objetivo: '', cursoSlug: this.curso.slug, metaSessoesSemanais: 3 });
    this.planoAberto.set(true);
  }

  editarPlano(plano: PlanoEstudo): void {
    this.planoEmEdicao.set(plano.id);
    this.planoForm.reset({
      titulo: plano.titulo,
      tema: plano.tema,
      objetivo: plano.objetivo,
      cursoSlug: plano.cursoSlug ?? '',
      metaSessoesSemanais: plano.metaSessoesSemanais,
    });
    this.planoAberto.set(true);
  }

  fecharFormularioPlano(): void {
    this.planoAberto.set(false);
  }

  percentualPlano(plano: PlanoEstudo): number {
    return Math.min(100, Math.round((plano.sessoesNaSemana / plano.metaSessoesSemanais) * 100));
  }

  registrarSessaoDaLicao(): void {
    this.sessaoForm.patchValue({
      planoEstudoId: this.planoVinculadoAoCurso(),
      duracaoMinutos: this.licaoSelecionada().duracaoMinutos,
    });
    this.registrarSessao();
  }

  salvarPlano(): void {
    if (this.planoForm.invalid) return;
    const valores = this.planoForm.getRawValue();
    const request: PlanoEstudoRequest = {
      titulo: valores.titulo!.trim(),
      tema: valores.tema!.trim(),
      objetivo: valores.objetivo?.trim() ?? '',
      metaSessoesSemanais: Number(valores.metaSessoesSemanais),
      cursoSlug: valores.cursoSlug || null,
    };
    const id = this.planoEmEdicao();
    const finalizado = () => {
      this.planoAberto.set(false);
      this.carregar();
    };
    const falhou = () => this.erro.set('Não foi possível salvar o plano.');

    if (id === null) {
      this.service.criarPlano(request).subscribe({ next: finalizado, error: falhou });
    } else {
      this.service.atualizarPlano(id, request).subscribe({ next: finalizado, error: falhou });
    }
  }

  registrarSessao(): void {
    if (this.sessaoForm.invalid) return;
    const valores = this.sessaoForm.getRawValue();
    this.service
      .criarSessao({
        planoEstudoId: valores.planoEstudoId ? Number(valores.planoEstudoId) : null,
        licaoSlug: this.licaoSelecionada().slug,
        data: `${valores.data}T12:00:00Z`,
        duracaoMinutos: Number(valores.duracaoMinutos),
        observacoes: valores.observacoes?.trim() ?? '',
      })
      .subscribe({
        next: () => {
          this.sessaoForm.reset({ planoEstudoId: '', duracaoMinutos: 25, data: this.dataHoje(), observacoes: '' });
          this.carregar();
        },
        error: () => this.erro.set('Não foi possível registrar a sessão.'),
      });
  }

  pedirRemocao(tipo: 'plano' | 'sessao', id: number): void {
    this.removerPendente.set({ tipo, id });
  }

  cancelarRemocao(): void {
    this.removerPendente.set(null);
  }

  confirmarRemocao(): void {
    const pendente = this.removerPendente();
    if (!pendente) return;
    const request = pendente.tipo === 'plano'
      ? this.service.deletarPlano(pendente.id)
      : this.service.deletarSessao(pendente.id);
    request.subscribe({
      next: () => {
        this.removerPendente.set(null);
        this.carregar();
      },
      error: () => this.erro.set('Não foi possível remover o item.'),
    });
  }

  formatarDuracao(minutos: number): string {
    const horas = Math.floor(minutos / 60);
    const restante = minutos % 60;
    if (horas === 0) return `${restante} min`;
    return restante === 0 ? `${horas} h` : `${horas} h ${restante} min`;
  }

  tituloLicao(slug: string | null): string | null {
    return this.curso.licoes.find((licao) => licao.slug === slug)?.titulo ?? null;
  }

  private carregar(): void {
    this.carregando.set(true);
    forkJoin({
      planos: this.service.listarPlanos(),
      sessoes: this.service.listarSessoes(),
      licoes: this.service.listarLicoesConcluidas(),
    })
      .pipe(catchError(() => {
        this.erro.set('Não foi possível carregar seus estudos. Tente novamente.');
        return of({ planos: [], sessoes: [], licoes: [] });
      }))
      .subscribe(({ planos, sessoes, licoes }) => {
        this.planos.set(planos);
        this.sessoes.set(sessoes);
        this.licoesConcluidas.set(licoes);
        this.erro.set('');
        this.carregando.set(false);
      });
  }

  private estaNaSemana(valor: string): boolean {
    const data = new Date(valor);
    const hoje = new Date();
    const inicioSemana = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
    inicioSemana.setDate(inicioSemana.getDate() - ((inicioSemana.getDay() + 6) % 7));
    const inicioProximaSemana = new Date(inicioSemana);
    inicioProximaSemana.setDate(inicioProximaSemana.getDate() + 7);
    return data >= inicioSemana && data < inicioProximaSemana;
  }

  private dataHoje(): string {
    const hoje = new Date();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');
    return `${hoje.getFullYear()}-${mes}-${dia}`;
  }

  private planoVinculadoAoCurso(): string {
    const plano = this.planos().find((item) => item.cursoSlug === this.curso.slug);
    return plano ? String(plano.id) : '';
  }
}
