namespace ControleGastos.Models;

public class Habito
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public string Titulo { get; set; } = "";
    public CategoriaAtividade Categoria { get; set; }
    public int[] DiasSemana { get; set; } = [];
    public DateOnly Inicio { get; set; }
    public DateOnly? Fim { get; set; }
    public DateOnly? ArquivadoEm { get; set; }
    public ICollection<HabitoPausa> Pausas { get; set; } = [];
    public ICollection<HabitoConclusao> Conclusoes { get; set; } = [];
}

public class HabitoPausa
{
    public int Id { get; set; }
    public int HabitoId { get; set; }
    public Habito Habito { get; set; } = null!;
    public DateOnly Inicio { get; set; }
    // Exclusive end: the resume day is scheduled again.
    public DateOnly? Fim { get; set; }
}

public class HabitoConclusao
{
    public int Id { get; set; }
    public int HabitoId { get; set; }
    public Habito Habito { get; set; } = null!;
    public DateOnly Data { get; set; }
    public bool Concluida { get; set; }
}

public class Objetivo
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public string Titulo { get; set; } = "";
    public string Tipo { get; set; } = "manual";
    public decimal Meta { get; set; }
    public DateOnly Inicio { get; set; }
    public DateOnly Fim { get; set; }
    public Moeda Moeda { get; set; }
    public decimal ValorManual { get; set; }
}

public class Orcamento
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public string Mes { get; set; } = "";
    public string Categoria { get; set; } = "";
    public Moeda Moeda { get; set; }
    public decimal Limite { get; set; }
}

public class DespesaRecorrente
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public string Descricao { get; set; } = "";
    public decimal Valor { get; set; }
    public string Categoria { get; set; } = "";
    public Moeda Moeda { get; set; }
    public FormaPagamento? FormaPagamento { get; set; }
    public int DiaVencimento { get; set; }
    public string Inicio { get; set; } = "";
    public string? Fim { get; set; }
    public bool Ativa { get; set; } = true;
}

// A separate ledger survives deletion of a transaction, preventing accidental regeneration.
public class LancamentoRecorrente
{
    public int Id { get; set; }
    public int DespesaRecorrenteId { get; set; }
    public DespesaRecorrente DespesaRecorrente { get; set; } = null!;
    public string Mes { get; set; } = "";
}
