import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../core/auth';

@Component({
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  selector: 'app-registro',
  styleUrl: './registro.css',
  templateUrl: './registro.html',
})
export class Registro {
  private fb = inject(FormBuilder);
  private auth = inject(Auth);
  private router = inject(Router);

  erro = '';

  form = this.fb.group({
    nome: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    senha: ['', [Validators.required, Validators.minLength(6)]],
  });

  onSubmit(): void {
    if (this.form.invalid) return;

    this.auth.register(this.form.getRawValue() as { nome: string; email: string; senha: string }).subscribe({
      next: () => this.router.navigate(['/transacoes']),
      error: () => this.erro = 'Não foi possível registrar. Verifique os dados.',
    });
  }
}