namespace ControleGastos.Models;

public enum CategoriaAtividade
{
    Pessoal,
    Estudos,
    Saude,
    Financas
}

public class Atividade
{
    public int Id { get; set; }
    public string Titulo { get; set; } = string.Empty;
    public DateTime Data { get; set; } = DateTime.UtcNow;
    public CategoriaAtividade Categoria { get; set; } = CategoriaAtividade.Pessoal;
    public bool Concluida { get; set; }
    public int UserId { get; set; }
    public User User { get; set; } = null!;
}
