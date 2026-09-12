import { Component, forwardRef, input, signal, computed, HostListener } from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';

function formatarISO(data: Date): string {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

@Component({
  imports: [],
  selector: 'app-datepicker',
  styleUrl: './datepicker.css',
  templateUrl: './datepicker.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => Datepicker),
      multi: true,
    },
  ],
})
export class Datepicker implements ControlValueAccessor {
  placeholder = input('Selecione uma data');

  aberto = signal(false);
  valorSelecionado = signal('');
  mesAtual = signal(new Date());
  disabled = signal(false);

  diasSemana = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

  private onChange: (valor: string) => void = () => {};
  private onTouched: () => void = () => {};

  diasDoMes = computed(() => {
    const ref = this.mesAtual();
    const ano = ref.getFullYear();
    const mes = ref.getMonth();
    const primeiroDiaSemana = new Date(ano, mes, 1).getDay();
    const totalDias = new Date(ano, mes + 1, 0).getDate();

    const dias: (number | null)[] = [];
    for (let i = 0; i < primeiroDiaSemana; i++) dias.push(null);
    for (let d = 1; d <= totalDias; d++) dias.push(d);
    return dias;
  });

  nomeMesAno = computed(() =>
    this.mesAtual().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  );

  get dataFormatada(): string {
    if (!this.valorSelecionado()) return '';
    const [ano, mes, dia] = this.valorSelecionado().split('-');
    return `${dia}/${mes}/${ano}`;
  }

  toggle(): void {
    if (this.disabled()) return;
    this.aberto.update((v) => !v);
    if (!this.aberto()) this.onTouched();
  }

  mesAnterior(): void {
    const ref = this.mesAtual();
    this.mesAtual.set(new Date(ref.getFullYear(), ref.getMonth() - 1, 1));
  }

  proximoMes(): void {
    const ref = this.mesAtual();
    this.mesAtual.set(new Date(ref.getFullYear(), ref.getMonth() + 1, 1));
  }

  selecionarDia(dia: number): void {
    const ref = this.mesAtual();
    const iso = formatarISO(new Date(ref.getFullYear(), ref.getMonth(), dia));
    this.valorSelecionado.set(iso);
    this.onChange(iso);
    this.onTouched();
    this.aberto.set(false);
  }

  ehSelecionado(dia: number): boolean {
    const ref = this.mesAtual();
    const iso = formatarISO(new Date(ref.getFullYear(), ref.getMonth(), dia));
    return iso === this.valorSelecionado();
  }

  ehHoje(dia: number): boolean {
    const ref = this.mesAtual();
    const hoje = new Date();
    return (
      ref.getFullYear() === hoje.getFullYear() &&
      ref.getMonth() === hoje.getMonth() &&
      dia === hoje.getDate()
    );
  }

  @HostListener('document:click', ['$event'])
  fecharAoClicarFora(event: MouseEvent): void {
    if (!(event.target as HTMLElement).closest('app-datepicker')) {
      this.aberto.set(false);
    }
  }

  writeValue(valor: string): void {
    this.valorSelecionado.set(valor ?? '');
    if (valor) {
      const [ano, mes] = valor.split('-').map(Number);
      this.mesAtual.set(new Date(ano, mes - 1, 1));
    }
  }

  registerOnChange(fn: (valor: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }
}
