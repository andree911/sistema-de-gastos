namespace ControleGastos.Models;

public class LicaoConcluida
{
    public int Id { get; set; }
    public string CursoSlug { get; set; } = string.Empty;
    public string LicaoSlug { get; set; } = string.Empty;
    public DateTime ConcluidaEm { get; set; } = DateTime.UtcNow;
    public int UserId { get; set; }
    public User User { get; set; } = null!;
}
