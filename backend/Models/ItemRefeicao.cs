namespace ControleGastos.Models;

public class ItemRefeicao
{
    public int Id { get; set; }
    public int RegistroSaudeId { get; set; }
    public RegistroSaude RegistroSaude { get; set; } = null!;
    public int AlimentoId { get; set; }
    public string Nome { get; set; } = string.Empty;
    public decimal Gramas { get; set; }
    public decimal Calorias100g { get; set; }
    public decimal Proteinas100g { get; set; }
    public decimal Carboidratos100g { get; set; }
    public decimal Gorduras100g { get; set; }
}
