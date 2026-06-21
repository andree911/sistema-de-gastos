namespace ControleGastos.Models;

public class Gasto
{
    public int Id { get; set; }
    public string Descricao { get; set; } = string.Empty;
    public decimal Valor { get; set; }
    public DateTime Data { get; set; }
    public string Categoria { get; set; } = string.Empty;
}
