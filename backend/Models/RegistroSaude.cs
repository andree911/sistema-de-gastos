namespace ControleGastos.Models;

public class RegistroSaude
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public DateOnly Data { get; set; }
    public string Tipo { get; set; } = string.Empty;
    public string Descricao { get; set; } = string.Empty;
    public int? Quantidade { get; set; }
    public int? Calorias { get; set; }
    public ICollection<ItemRefeicao> Alimentos { get; set; } = new List<ItemRefeicao>();
}
