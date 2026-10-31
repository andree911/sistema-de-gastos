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

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

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
