import { Component, forwardRef, input, signal, HostListener } from '@angular/core';
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
    if (!this.aberto()) this.onTouched();
  }

  selecionar(opcao: OpcaoSelect): void {
    this.valorSelecionado.set(opcao.valor);
    this.onChange(opcao.valor);
    this.onTouched();
    this.aberto.set(false);
  }

  @HostListener('document:click', ['$event'])
  fecharAoClicarFora(event: MouseEvent): void {
    if (!(event.target as HTMLElement).closest('app-select')) {
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
