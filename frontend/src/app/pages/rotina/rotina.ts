import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CategoriaAtividade, Atividade, Rotina as RotinaService } from '../../core/rotina';

@Component({
  imports: [CommonModule, ReactiveFormsModule],
  selector: 'app-rotina',
  styleUrl: './rotina.css',
  templateUrl: './rotina.html',
})
export class Rotina implements OnInit {
  private service = inject(RotinaService);
  private fb = inject(FormBuilder);

  atividades = signal<Atividade[]>([]);
  erro = signal('');
  formAberto = signal(false);
  hoje = new Date();
  dataSelecionada = this.formatarData(this.hoje);

  categorias = [
    { valor: CategoriaAtividade.Pessoal, nome: 'Pessoal' },
    { valor: CategoriaAtividade.Estudos, nome: 'Estudos' },
    { valor: CategoriaAtividade.Saude, nome: 'Saúde' },
    { valor: CategoriaAtividade.Financas, nome: 'Finanças' },
  ];

  form = this.fb.group({
    titulo: ['', Validators.required],
    categoria: [CategoriaAtividade.Pessoal, Validators.required],
  });

  concluidas = computed(() => this.atividades().filter((atividade) => atividade.concluida).length);
  progresso = computed(() => {
    const total = this.atividades().length;
    return total === 0 ? 0 : Math.round((this.concluidas() / total) * 100);
  });

  ngOnInit(): void {
    this.carregar();
  }

  nomeCategoria(categoria: CategoriaAtividade): string {
    return this.categorias.find((item) => item.valor === categoria)?.nome ?? 'Pessoal';
  }

  alternarFormulario(): void {
    this.formAberto.update((aberto) => !aberto);
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    const valores = this.form.getRawValue();
    this.service.criar({
      titulo: valores.titulo!,
      data: `${this.dataSelecionada}T12:00:00`,
      categoria: Number(valores.categoria) as CategoriaAtividade,
      concluida: false,
    }).subscribe({
      next: () => {
        this.form.reset({ titulo: '', categoria: CategoriaAtividade.Pessoal });
        this.formAberto.set(false);
        this.carregar();
      },
      error: () => this.erro.set('Não foi possível adicionar a atividade.'),
    });
  }

  alternarConclusao(atividade: Atividade): void {
    this.service.atualizar(atividade.id, {
      titulo: atividade.titulo,
      data: atividade.data,
      categoria: atividade.categoria,
      concluida: !atividade.concluida,
    }).subscribe({
      next: () => this.carregar(),
      error: () => this.erro.set('Não foi possível atualizar a atividade.'),
    });
  }

  remover(atividade: Atividade): void {
    this.service.deletar(atividade.id).subscribe({
      next: () => this.carregar(),
      error: () => this.erro.set('Não foi possível remover a atividade.'),
    });
  }

  private carregar(): void {
    this.service.listar(this.dataSelecionada).subscribe({
      next: (atividades) => {
        this.atividades.set(atividades);
        this.erro.set('');
      },
      error: () => this.erro.set('Não foi possível carregar a rotina.'),
    });
  }

  private formatarData(data: Date): string {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  }
}
