import { Component, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { Navbar } from './shared/navbar/navbar';

const ROTAS_SEM_NAVBAR = ['/login', '/registro'];

@Component({
  imports: [RouterOutlet, Navbar],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  mostrarNavbar = signal(false);

  constructor(router: Router) {
    router.events.pipe(filter((evento) => evento instanceof NavigationEnd)).subscribe((evento) => {
      this.mostrarNavbar.set(!ROTAS_SEM_NAVBAR.some((rota) => evento.urlAfterRedirects.startsWith(rota)));
    });
  }
}
