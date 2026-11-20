using Microsoft.EntityFrameworkCore;
using ControleGastos.Models;

namespace ControleGastos.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options): base(options) {}

    public DbSet<User> Users { get; set; }
    public DbSet<Transacao> Transacoes { get; set; }
    public DbSet<Atividade> Atividades { get; set; }
    public DbSet<PlanoEstudo> PlanosEstudo { get; set; }
    public DbSet<SessaoEstudo> SessoesEstudo { get; set; }
    public DbSet<LicaoConcluida> LicoesConcluidas { get; set; }
    public DbSet<MateriaEstudo> MateriasEstudo { get; set; }
    public DbSet<TopicoEstudo> TopicosEstudo { get; set; }
    public DbSet<DiarioSaude> DiariosSaude { get; set; }
    public DbSet<RegistroSaude> RegistrosSaude { get; set; }
    public DbSet<ItemRefeicao> ItensRefeicao { get; set; }
    public DbSet<TraducaoNutricional> TraducoesNutricionais { get; set; }
    public DbSet<Habito> Habitos { get; set; }
    public DbSet<HabitoPausa> HabitosPausas { get; set; }
    public DbSet<HabitoConclusao> HabitosConclusoes { get; set; }
    public DbSet<Objetivo> Objetivos { get; set; }
    public DbSet<Orcamento> Orcamentos { get; set; }
    public DbSet<DespesaRecorrente> DespesasRecorrentes { get; set; }
    public DbSet<LancamentoRecorrente> LancamentosRecorrentes { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.Entity<Habito>().Property(x => x.Titulo).HasMaxLength(200);
        modelBuilder.Entity<Habito>().HasIndex(x => x.UserId);
        modelBuilder.Entity<HabitoConclusao>().HasIndex(x => new { x.HabitoId, x.Data }).IsUnique();
        modelBuilder.Entity<HabitoPausa>().HasIndex(x => x.HabitoId).IsUnique().HasFilter("\"Fim\" IS NULL");
        modelBuilder.Entity<Objetivo>().Property(x => x.Titulo).HasMaxLength(200);
        modelBuilder.Entity<Objetivo>().Property(x => x.Tipo).HasMaxLength(20);
        modelBuilder.Entity<Objetivo>().Property(x => x.Meta).HasPrecision(18, 2);
        modelBuilder.Entity<Objetivo>().Property(x => x.ValorManual).HasPrecision(18, 2);
        modelBuilder.Entity<Orcamento>().Property(x => x.Mes).HasMaxLength(7);
        modelBuilder.Entity<Orcamento>().Property(x => x.Categoria).HasMaxLength(100);
        modelBuilder.Entity<Orcamento>().Property(x => x.Limite).HasPrecision(18, 2);
        modelBuilder.Entity<Orcamento>().HasIndex(x => new { x.UserId, x.Mes, x.Moeda, x.Categoria }).IsUnique();
        modelBuilder.Entity<DespesaRecorrente>().Property(x => x.Descricao).HasMaxLength(200);
        modelBuilder.Entity<DespesaRecorrente>().Property(x => x.Categoria).HasMaxLength(100);
        modelBuilder.Entity<DespesaRecorrente>().Property(x => x.Valor).HasPrecision(18, 2);
        modelBuilder.Entity<DespesaRecorrente>().Property(x => x.Inicio).HasMaxLength(7);
        modelBuilder.Entity<DespesaRecorrente>().Property(x => x.Fim).HasMaxLength(7);
        modelBuilder.Entity<LancamentoRecorrente>().Property(x => x.Mes).HasMaxLength(7);
        modelBuilder.Entity<LancamentoRecorrente>().HasIndex(x => new { x.DespesaRecorrenteId, x.Mes }).IsUnique();
        modelBuilder.Entity<TraducaoNutricional>().HasKey(x => x.Chave);
        modelBuilder.Entity<TraducaoNutricional>().Property(x => x.Chave).HasMaxLength(64);
        modelBuilder.Entity<TraducaoNutricional>().Property(x => x.Original).HasMaxLength(2000);
        modelBuilder.Entity<TraducaoNutricional>().Property(x => x.Traducao).HasMaxLength(4000);
        modelBuilder.Entity<ItemRefeicao>().Property(x => x.Nome).HasMaxLength(500);
        modelBuilder.Entity<ItemRefeicao>().Property(x => x.Gramas).HasPrecision(12, 2);
        modelBuilder.Entity<ItemRefeicao>().Property(x => x.Calorias100g).HasPrecision(12, 4);
        modelBuilder.Entity<ItemRefeicao>().Property(x => x.Proteinas100g).HasPrecision(12, 4);
        modelBuilder.Entity<ItemRefeicao>().Property(x => x.Carboidratos100g).HasPrecision(12, 4);
        modelBuilder.Entity<ItemRefeicao>().Property(x => x.Gorduras100g).HasPrecision(12, 4);
        modelBuilder.Entity<DiarioSaude>().HasIndex(x => new { x.UserId, x.Data }).IsUnique();
        modelBuilder.Entity<DiarioSaude>().Property(x => x.Observacoes).HasMaxLength(2000);
        modelBuilder.Entity<RegistroSaude>().HasIndex(x => new { x.UserId, x.Data });
        modelBuilder.Entity<RegistroSaude>().Property(x => x.Tipo).HasMaxLength(20);
        modelBuilder.Entity<RegistroSaude>().Property(x => x.Descricao).HasMaxLength(300);
        modelBuilder.Entity<MateriaEstudo>().Property(x => x.Titulo).HasMaxLength(160);
        modelBuilder.Entity<TopicoEstudo>().Property(x => x.Titulo).HasMaxLength(200);
        modelBuilder.Entity<TopicoEstudo>().Property(x => x.Status).HasMaxLength(20);
        modelBuilder.Entity<TopicoEstudo>().Property(x => x.FonteCatalogo).HasMaxLength(40);
        modelBuilder.Entity<TopicoEstudo>().Property(x => x.CodigoCatalogo).HasMaxLength(80);
        modelBuilder.Entity<TopicoEstudo>().HasIndex(x => x.MateriaEstudoId);
        modelBuilder.Entity<TopicoEstudo>().HasIndex(x => new { x.MateriaEstudoId, x.FonteCatalogo, x.CodigoCatalogo })
            .IsUnique().HasFilter("\"FonteCatalogo\" IS NOT NULL AND \"CodigoCatalogo\" IS NOT NULL");
        modelBuilder.Entity<SessaoEstudo>()
            .HasOne(x => x.TopicoEstudo).WithMany(x => x.Sessoes)
            .HasForeignKey(x => x.TopicoEstudoId).OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<PlanoEstudo>()
            .HasOne(plano => plano.User)
            .WithMany()
            .HasForeignKey(plano => plano.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<SessaoEstudo>()
            .HasOne(sessao => sessao.User)
            .WithMany()
            .HasForeignKey(sessao => sessao.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<SessaoEstudo>()
            .HasOne(sessao => sessao.PlanoEstudo)
            .WithMany(plano => plano.Sessoes)
            .HasForeignKey(sessao => sessao.PlanoEstudoId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<LicaoConcluida>()
            .HasOne(licao => licao.User)
            .WithMany()
            .HasForeignKey(licao => licao.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<LicaoConcluida>()
            .HasIndex(licao => new { licao.UserId, licao.CursoSlug, licao.LicaoSlug })
            .IsUnique();
    }
}
