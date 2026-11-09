namespace ControleGastos.Models;

public class TopicoEstudo
{
    public int Id { get; set; }
    public string Titulo { get; set; } = string.Empty;
    public string Status { get; set; } = "a-estudar";
    public DateOnly? DataPrevista { get; set; }
    public string? FonteCatalogo { get; set; }
    public string? CodigoCatalogo { get; set; }
    public int MateriaEstudoId { get; set; }
    public MateriaEstudo MateriaEstudo { get; set; } = null!;
    public ICollection<SessaoEstudo> Sessoes { get; set; } = new List<SessaoEstudo>();
}
