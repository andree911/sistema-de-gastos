namespace ControleGastos.Models;

public class PlanoEstudo
{
    public int Id { get; set; }
    public string Titulo { get; set; } = string.Empty;
    public string Tema { get; set; } = string.Empty;
    public string Objetivo { get; set; } = string.Empty;
    public int MetaSessoesSemanais { get; set; }
    public string? CursoSlug { get; set; }
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public ICollection<SessaoEstudo> Sessoes { get; set; } = new List<SessaoEstudo>();
}
