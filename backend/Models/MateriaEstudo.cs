namespace ControleGastos.Models;

public class MateriaEstudo
{
    public int Id { get; set; }
    public string Titulo { get; set; } = string.Empty;
    public int PlanoEstudoId { get; set; }
    public PlanoEstudo PlanoEstudo { get; set; } = null!;
    public ICollection<TopicoEstudo> Topicos { get; set; } = new List<TopicoEstudo>();
}
