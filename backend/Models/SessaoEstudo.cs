namespace ControleGastos.Models;

public class SessaoEstudo
{
    public int Id { get; set; }
    public DateTime Data { get; set; }
    public int DuracaoMinutos { get; set; }
    public string Observacoes { get; set; } = string.Empty;
    public string? LicaoSlug { get; set; }
    public int? PlanoEstudoId { get; set; }
    public int? TopicoEstudoId { get; set; }
    public TopicoEstudo? TopicoEstudo { get; set; }
    public PlanoEstudo? PlanoEstudo { get; set; }
    public int UserId { get; set; }
    public User User { get; set; } = null!;
}
