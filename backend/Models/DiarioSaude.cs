namespace ControleGastos.Models;

public class DiarioSaude
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public DateOnly Data { get; set; }
    public int? SonoMinutos { get; set; }
    public int? Passos { get; set; }
    public int? Disposicao { get; set; }
    public string Observacoes { get; set; } = string.Empty;
}
