using System.Globalization;
using ControleGastos.Models;

namespace ControleGastos.Services;

public static class AcompanhamentoRegras
{
    public static DateOnly Hoje => DateOnly.FromDateTime(TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow,
        TimeZoneInfo.FindSystemTimeZoneById("America/Sao_Paulo")));
    public static bool DataValida(DateOnly data) => data.Year is >= 2000 and <= 2100;
    public static bool TextoValido(string? texto, int max) => !string.IsNullOrWhiteSpace(texto) && texto.Trim().Length <= max;
    public static bool ValorValido(decimal valor) => valor > 0 && valor <= 999999999999m && decimal.Round(valor, 2) == valor;
    public static bool MesValido(string? mes, out DateOnly data) => DateOnly.TryParseExact(mes + "-01", "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out data) && DataValida(data);
    public static DateTime Utc(DateOnly data) => DateTime.SpecifyKind(data.ToDateTime(TimeOnly.MinValue), DateTimeKind.Utc);
    public static bool Agendado(Habito habito, DateOnly data) => data >= habito.Inicio
        && (!habito.Fim.HasValue || data <= habito.Fim.Value)
        && (!habito.ArquivadoEm.HasValue || data < habito.ArquivadoEm.Value)
        && habito.DiasSemana.Contains((int)data.DayOfWeek)
        && !habito.Pausas.Any(p => data >= p.Inicio && (!p.Fim.HasValue || data < p.Fim.Value));
}
