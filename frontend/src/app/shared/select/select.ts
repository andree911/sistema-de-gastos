import { Component, ElementRef, forwardRef, inject, input, signal, HostListener } from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';

export interface OpcaoSelect {
  valor: any;
  nome: string;
}

@Component({
  imports: [],
  selector: 'app-select',
  styleUrl: './select.css',
  templateUrl: './select.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => Select),
      multi: true,
    },
  ],
})
export class Select implements ControlValueAccessor {
  private static sequencia = 0;
  private elemento = inject(ElementRef<HTMLElement>);
  listaId = 'opcoes-' + ++Select.sequencia;
  ariaLabel = input('');
  ativo = signal(0);
  opcoes = input.required<OpcaoSelect[]>();
  placeholder = input('Selecione');

  aberto = signal(false);
  valorSelecionado = signal<any>(null);
  disabled = signal(false);

  private onChange: (valor: any) => void = () => {};
  private onTouched: () => void = () => {};

  get opcaoSelecionada(): OpcaoSelect | undefined {
    return this.opcoes().find((o) => o.valor === this.valorSelecionado());
  }

  toggle(): void {
    if (this.disabled()) return;
    this.aberto.update((v) => !v);
    this.ativo.set(Math.max(0, this.opcoes().findIndex(o => o.valor === this.valorSelecionado())));
    if (!this.aberto()) this.onTouched();
  }

  tecla(event: KeyboardEvent): void {
    if (this.disabled()) return;
    const total = this.opcoes().length;
    if (!total) return;
    if (event.key === 'Escape') { this.aberto.set(false); event.preventDefault(); return; }
    if (event.key === 'Tab') { this.aberto.set(false); this.onTouched(); return; }
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      if (!this.aberto()) { this.aberto.set(true); this.ativo.set(Math.max(0, this.opcoes().findIndex(o => o.valor === this.valorSelecionado()))); }
      else this.ativo.set(event.key === 'Home' ? 0 : event.key === 'End' ? total - 1 : (this.ativo() + (event.key === 'ArrowDown' ? 1 : -1) + total) % total);
    } else if (this.aberto() && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault(); this.selecionar(this.opcoes()[this.ativo()]);
    }
  }

  selecionar(opcao: OpcaoSelect): void {
    this.valorSelecionado.set(opcao.valor);
    this.onChange(opcao.valor);
    this.onTouched();
    this.aberto.set(false);
  }

  @HostListener('document:click', ['$event'])
  fecharAoClicarFora(event: MouseEvent): void {
    if (!this.elemento.nativeElement.contains(event.target as Node)) {
      this.aberto.set(false);
    }
  }

  writeValue(valor: any): void {
    this.valorSelecionado.set(valor);
  }

  registerOnChange(fn: (valor: any) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }
}
