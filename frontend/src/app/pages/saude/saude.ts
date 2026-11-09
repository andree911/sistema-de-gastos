import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { FormsModule, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Observable, Subscription, forkJoin } from 'rxjs';
import { DiaSaude, RegistroSaude, ResumoSaude, SaudeService, TipoSaude } from '../../core/saude';
import { Select } from '../../shared/select/select';
import { Datepicker } from '../../shared/datepicker/datepicker';
import { EditorRefeicao } from './editor-refeicao';
import { Auth } from '../../core/auth';

@Component({ selector: 'app-saude', imports: [FormsModule, ReactiveFormsModule, Select, Datepicker, EditorRefeicao], templateUrl: './saude.html', styleUrl: './saude.css' })
export class Saude implements OnInit, OnDestroy {
  private service = inject(SaudeService); private fb = inject(FormBuilder); private route = inject(ActivatedRoute);
  private auth = inject(Auth); private perfilSub?: Subscription;
  private consulta?: Subscription; private alteracao?: Subscription;
  data = signal(this.iso(new Date())); dia = signal<DiaSaude | null>(null); historico = signal<ResumoSaude[]>([]);
  carregando = signal(true); salvando = signal(false); erro = signal(''); aviso = signal('');
  registroAberto = signal(false); registroId = signal<number | undefined>(undefined); exclusao = signal<RegistroSaude | null>(null);
  disposicoes = [{ valor: null, nome: 'Não informado' }, { valor: 1, nome: 'Muito baixa' }, { valor: 2, nome: 'Baixa' }, { valor: 3, nome: 'Regular' }, { valor: 4, nome: 'Boa' }, { valor: 5, nome: 'Muito boa' }];
  diarioForm = this.fb.group({
    sonoHoras: [null as number | null, [Validators.min(0), Validators.max(24)]],
    passos: [null as number | null, [Validators.min(0), Validators.max(200000), Validators.pattern(/^\d+$/)]],
    disposicao: [null as number | null], observacoes: ['', Validators.maxLength(2000)],
  });
  registroForm = this.fb.group({
    descricao: ['', Validators.maxLength(300)], quantidade: [250 as number | null],
    calorias: [null as number | null, [Validators.min(0), Validators.max(20000), Validators.pattern(/^\d+$/)]],
  });
  tipo = signal<TipoSaude>('agua');
  refeicaoEmEdicao = signal<RegistroSaude | undefined>(undefined);
  ocupacaoRefeicao(ocupado: boolean): void { this.salvando.set(ocupado); if (ocupado) this.diarioForm.disable(); else this.diarioForm.enable(); }
  refeicaoSalva(): void { this.registroAberto.set(false); this.aviso.set('Refeição salva.'); this.carregar(); }
  ngOnInit(): void {
    const query = this.route.snapshot.queryParamMap.get('data');
    if (query && /^\d{4}-\d{2}-\d{2}$/.test(query) && !isNaN(new Date(query + 'T12:00:00').getTime())) this.data.set(query);
    this.perfilSub = this.auth.obterPerfil().subscribe({ next: () => this.carregar(), error: () => { this.erro.set('Não foi possível carregar a preferência da conta.'); this.carregando.set(false); } });
  }
  ngOnDestroy(): void { this.consulta?.unsubscribe(); this.alteracao?.unsubscribe(); this.perfilSub?.unsubscribe(); }
  selecionar(data: string): void {
    if (this.salvando() || !data || data === this.data()) return;
    this.data.set(data); this.diarioForm.markAsPristine(); this.registroAberto.set(false); this.aviso.set(''); this.carregar();
  }
  navegar(delta: number): void { const d = new Date(this.data() + 'T12:00:00'); d.setDate(d.getDate() + delta); this.selecionar(this.iso(d)); }
  hoje(): void { this.selecionar(this.iso(new Date())); }
  carregar(): void {
    this.consulta?.unsubscribe(); this.erro.set(''); this.carregando.set(true);
    const inicio = new Date(this.data() + 'T12:00:00'); inicio.setDate(inicio.getDate() - 6);
    this.consulta = forkJoin({ dia: this.service.dia(this.data()), historico: this.service.historico(this.iso(inicio), this.data()) }).subscribe({
      next: ({ dia, historico }) => {
        this.dia.set(dia); this.historico.set(historico);
        if (!this.diarioForm.dirty) this.diarioForm.reset({ sonoHoras: dia.resumo.sonoMinutos === null ? null : Math.round(dia.resumo.sonoMinutos / 60 * 100) / 100,
          passos: dia.resumo.passos, disposicao: dia.resumo.disposicao, observacoes: dia.resumo.observacoes });
        this.carregando.set(false);
      }, error: () => { this.dia.set(null); this.historico.set([]); this.erro.set('Não foi possível carregar seus registros de saúde.'); this.carregando.set(false); },
    });
  }
  private executar(req: Observable<unknown>, mensagem: string, fim?: () => void): void {
    if (this.salvando()) return;
    this.diarioForm.disable(); this.registroForm.disable();
    this.salvando.set(true); this.erro.set(''); this.aviso.set('');
    this.alteracao = req.subscribe({
      next: () => { this.diarioForm.enable(); this.registroForm.enable(); this.salvando.set(false); fim?.(); this.aviso.set(mensagem); this.carregar(); },
      error: () => { this.diarioForm.enable(); this.registroForm.enable(); this.salvando.set(false); this.erro.set('Não foi possível salvar. Confira os campos e tente novamente.'); },
    });
  }
  salvarDiario(): void {
    if (this.diarioForm.invalid) return;
    const v = this.diarioForm.getRawValue();
    this.executar(this.service.salvarDiario(this.data(), { sonoMinutos: v.sonoHoras === null ? null : Math.round(v.sonoHoras * 60),
      passos: v.passos, disposicao: v.disposicao, observacoes: v.observacoes?.trim() ?? '' }), 'Diário salvo.', () => this.diarioForm.markAsPristine());
  }
  abrir(tipo: TipoSaude, registro?: RegistroSaude): void {
    if (this.salvando()) return;
    this.tipo.set(tipo); this.registroId.set(registro?.id); this.registroAberto.set(true);
    this.refeicaoEmEdicao.set(tipo === 'refeicao' ? registro : undefined);
    this.registroForm.reset({ descricao: registro?.descricao ?? '', quantidade: registro?.quantidade ?? (tipo === 'agua' ? 250 : null), calorias: registro?.calorias ?? null });
  }
  registroValido(): boolean {
    const v = this.registroForm.getRawValue();
    if (this.registroForm.invalid) return false;
    if (this.tipo() === 'refeicao') return !!v.descricao?.trim();
    return Number.isInteger(v.quantidade) && v.quantidade! > 0 && v.quantidade! <= (this.tipo() === 'agua' ? 20000 : 1440)
      && (this.tipo() === 'agua' || !!v.descricao?.trim());
  }
  salvarRegistro(): void {
    if (!this.registroValido()) return;
    const v = this.registroForm.getRawValue();
    this.executar(this.service.salvarRegistro({ data: this.data(), tipo: this.tipo(), descricao: v.descricao?.trim() ?? '',
      quantidade: this.tipo() === 'refeicao' ? null : v.quantidade, calorias: this.tipo() === 'refeicao' ? v.calorias : null }, this.registroId()), 'Registro salvo.', () => this.registroAberto.set(false));
  }
  agua(ml: number): void { this.executar(this.service.salvarRegistro({ data: this.data(), tipo: 'agua', quantidade: ml, descricao: '', calorias: null }), 'Água registrada.'); }
  excluir(): void { const r = this.exclusao(); if (r) this.executar(this.service.excluir(r.id), 'Registro excluído.', () => this.exclusao.set(null)); }
  nomeTipo(tipo: TipoSaude): string { return { agua: 'Água', refeicao: 'Refeição', exercicio: 'Exercício' }[tipo]; }
  disposicaoNome(valor: number | null): string { return this.disposicoes.find(x => x.valor === valor)?.nome ?? 'Não informado'; }
  sono(minutos: number | null): string { return minutos === null ? '—' : Math.floor(minutos / 60) + 'h ' + String(minutos % 60).padStart(2, '0') + 'min'; }
  litros(ml: number): string { return (ml / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 2 }) + ' L'; }
  diaCurto(data: string): string { return new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' }).format(new Date(data + 'T12:00:00')); }
  private iso(d: Date): string { return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-'); }
}
