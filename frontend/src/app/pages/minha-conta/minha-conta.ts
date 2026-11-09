import { Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Auth, Perfil } from '../../core/auth';
import { Select } from '../../shared/select/select';
import { IdiomaService } from '../../core/idioma';

@Component({
  imports: [ReactiveFormsModule, Select],
  selector: 'app-minha-conta',
  styleUrl: './minha-conta.css',
  templateUrl: './minha-conta.html',
})
export class MinhaConta implements OnInit {
  private auth = inject(Auth);
  private idiomaService = inject(IdiomaService);

  idiomas = [
    { valor: 'pt-BR', nome: 'Português (Brasil)' },
    { valor: 'en-US', nome: 'English (United States)' },
  ];
  idioma = new FormControl('pt-BR', { nonNullable: true, validators: [Validators.required] });
  idiomaSalvo = signal('');
  perfil = signal<Perfil | null>(null);
  carregando = signal(true);
  erro = signal('');

  ngOnInit(): void {
    this.auth.obterPerfil().subscribe({
      next: (perfil) => {
        this.perfil.set(perfil);
        const idiomaPreferido = localStorage.getItem(this.chaveIdioma(perfil.id));
        if (this.idiomas.some((opcao) => opcao.valor === idiomaPreferido)) {
          this.idioma.setValue(idiomaPreferido!);
          this.idiomaSalvo.set(idiomaPreferido!);
        }
        this.carregando.set(false);
      },
      error: () => {
        this.erro.set('Não foi possível carregar os dados da conta.');
        this.carregando.set(false);
      },
    });
  }

  inicialNome(): string {
    return this.perfil()?.nome?.trim().charAt(0).toUpperCase() ?? '?';
  }

  salvarIdioma(): void {
    const perfilId = this.perfil()?.id;
    if (this.idioma.invalid || perfilId === undefined) return;
    this.idiomaService.salvar(perfilId, this.idioma.value);
    this.idiomaSalvo.set(this.idioma.value);
  }

  private chaveIdioma(perfilId: number): string {
    return `idioma-preferido:${perfilId}`;
  }
}
