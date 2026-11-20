import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Auth } from '../../core/auth';

interface LinkNavegacao {
  rota: string;
  rotulo: string;
}

@Component({
  imports: [RouterLink, RouterLinkActive],
  selector: 'app-navbar',
  styleUrl: './navbar.css',
  templateUrl: './navbar.html',
})
export class Navbar {
  private auth = inject(Auth);
  private router = inject(Router);

  links: LinkNavegacao[] = [
    { rota: '/rotina', rotulo: 'Meu dia' },
    { rota: '/objetivos', rotulo: 'Objetivos' },
    { rota: '/estudos', rotulo: 'Estudos' },
    { rota: '/saude', rotulo: 'Saúde' },
    { rota: '/financas', rotulo: 'Finanças' },
    { rota: '/transacoes', rotulo: 'Transações' },
    { rota: '/minha-conta', rotulo: 'Minha conta' },
  ];

  sair(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
