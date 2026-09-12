import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Registro } from './pages/registro/registro';
import { Transacoes } from './pages/transacoes/transacoes';
import { TransacaoDetalhe } from './pages/transacao-detalhe/transacao-detalhe';
import { authGuard } from './core/auth-guard';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'registro', component: Registro },
  { path: 'transacoes', component: Transacoes, canActivate: [authGuard] },
  { path: 'transacoes/:id', component: TransacaoDetalhe, canActivate: [authGuard] },
  { path: '', redirectTo: 'login', pathMatch: 'full' }
];
