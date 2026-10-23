import { Component, OnInit, inject, signal } from '@angular/core';
import { Auth, Perfil } from '../../core/auth';

@Component({
  imports: [],
  selector: 'app-minha-conta',
  styleUrl: './minha-conta.css',
  templateUrl: './minha-conta.html',
})
export class MinhaConta implements OnInit {
  private auth = inject(Auth);

  perfil = signal<Perfil | null>(null);
  carregando = signal(true);
  erro = signal('');

  ngOnInit(): void {
    this.auth.obterPerfil().subscribe({
      next: (perfil) => {
        this.perfil.set(perfil);
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
}
