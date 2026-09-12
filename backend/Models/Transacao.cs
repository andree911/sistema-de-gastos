namespace ControleGastos.Models;

public enum TipoTransacao
{
    Gasto,
    Receita
}

public class Transacao
{
    public int Id { get; set; }
    public string Descricao { get; set; } = string.Empty;
    public decimal Valor { get; set; }
    public string Categoria { get; set; } = string.Empty;
    public int UserId { get; set; }
    public DateTime Data { get; set; } = DateTime.UtcNow;
    public User User { get; set; } = null!;
    public TipoTransacao Tipo { get; set; }
    public FormaPagamento? FormaPagamento { get; set; }
}