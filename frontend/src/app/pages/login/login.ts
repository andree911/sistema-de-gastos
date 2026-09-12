import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../core/auth';

@Component({
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  selector: 'app-login',
  styleUrl: './login.css',
  templateUrl: './login.html',
})

export class Login {
  private fb = inject(FormBuilder);
  private auth = inject(Auth);
  private router = inject(Router);

  erro = '';

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    senha: ['', Validators.required],
  });

  onSubmit(): void {
    if (this.form.invalid) return;

    this.auth.login(this.form.getRawValue() as { email: string; senha: string }).subscribe({
      next: () => this.router.navigate(['/transacoes']),
      error: () => this.erro = 'Email ou senha inválidos.',
    });
  }
}