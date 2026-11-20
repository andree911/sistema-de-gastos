using System.Security.Claims;
using ControleGastos.Data;
using ControleGastos.Models;
using ControleGastos.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ControleGastos.Controllers;

[Authorize, ApiController, Route("api/habitos")]
public class HabitosController(AppDbContext context) : ControllerBase
{
    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    public record HabitoRequest(string Titulo, CategoriaAtividade Categoria, int[] DiasSemana, DateOnly Inicio, DateOnly? Fim);
    public record PausaRequest(bool Pausado, DateOnly? Data);
    public record ConclusaoRequest(bool Concluida);

    [HttpGet]
    public async Task<IActionResult> Listar([FromQuery] DateOnly inicio, [FromQuery] DateOnly fim)
    {
        if (!AcompanhamentoRegras.DataValida(inicio) || !AcompanhamentoRegras.DataValida(fim) || fim < inicio || fim.DayNumber - inicio.DayNumber > 365)
            return BadRequest("Informe um período de até 366 dias.");
        var habitos = await context.Habitos.AsNoTracking().Include(x => x.Pausas)
            .Include(x => x.Conclusoes.Where(c => c.Data >= inicio && c.Data <= fim))
            .Where(x => x.UserId == UserId).OrderBy(x => x.Id).ToListAsync();
        return Ok(habitos.Select(h => Resposta(h, inicio, fim)));
    }

    [HttpPost]
    public async Task<IActionResult> Criar(HabitoRequest request)
    {
        if (!Valido(request)) return BadRequest("Confira o título, a categoria, os dias da semana e o período.");
        var h = new Habito { UserId = UserId, Titulo = request.Titulo.Trim(), Categoria = request.Categoria,
            DiasSemana = request.DiasSemana.Distinct().Order().ToArray(), Inicio = request.Inicio, Fim = request.Fim };
        context.Habitos.Add(h);
        await context.SaveChangesAsync();
        return Ok(new { h.Id });
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Editar(int id, HabitoRequest request)
    {
        if (!Valido(request)) return BadRequest("Confira os campos do hábito.");
        var h = await context.Habitos.FirstOrDefaultAsync(x => x.Id == id && x.UserId == UserId);
        if (h is null) return NotFound();
        if (h.ArquivadoEm.HasValue) return BadRequest("Este hábito está arquivado.");
        if (h.Inicio != request.Inicio || h.Fim != request.Fim || !h.DiasSemana.Order().SequenceEqual(request.DiasSemana.Distinct().Order()))
            return BadRequest("Para mudar o calendário, arquive este hábito e crie outro. O histórico será preservado.");
        h.Titulo = request.Titulo.Trim(); h.Categoria = request.Categoria;
        await context.SaveChangesAsync();
        return NoContent();
    }

    [HttpPut("{id:int}/pausa")]
    public async Task<IActionResult> Pausar(int id, PausaRequest request)
    {
        var hoje = AcompanhamentoRegras.Hoje;
        if (request.Data.HasValue && request.Data != hoje) return BadRequest("A pausa ou retomada começa hoje.");
        await using var tx = await context.Database.BeginTransactionAsync();
        // Serialize changes to one user's calendars to keep pause/resume/completion consistent.
        await context.Database.ExecuteSqlInterpolatedAsync($"SELECT pg_advisory_xact_lock({UserId}, {41901})");
        var h = await context.Habitos.Include(x => x.Pausas).FirstOrDefaultAsync(x => x.Id == id && x.UserId == UserId);
        if (h is null) return NotFound();
        if (h.ArquivadoEm.HasValue) return BadRequest("Este hábito está arquivado.");
        var pausa = h.Pausas.FirstOrDefault(p => !p.Fim.HasValue);
        if (request.Pausado && pausa is null) h.Pausas.Add(new HabitoPausa { Inicio = hoje });
        else if (!request.Pausado && pausa is not null) pausa.Fim = hoje;
        await context.SaveChangesAsync();
        await tx.CommitAsync();
        return NoContent();
    }

    [HttpPut("{id:int}/conclusoes/{data}")]
    public async Task<IActionResult> Concluir(int id, DateOnly data, ConclusaoRequest request)
    {
        if (!AcompanhamentoRegras.DataValida(data) || data > AcompanhamentoRegras.Hoje)
            return BadRequest("A conclusão deve ser de hoje ou de um dia anterior.");
        await using var tx = await context.Database.BeginTransactionAsync();
        await context.Database.ExecuteSqlInterpolatedAsync($"SELECT pg_advisory_xact_lock({UserId}, {41901})");
        var h = await context.Habitos.Include(x => x.Pausas).Include(x => x.Conclusoes.Where(c => c.Data == data))
            .FirstOrDefaultAsync(x => x.Id == id && x.UserId == UserId);
        if (h is null) return NotFound();
        var conclusao = h.Conclusoes.FirstOrDefault();
        if (!AcompanhamentoRegras.Agendado(h, data) && conclusao is null)
            return BadRequest("O hábito não está previsto para este dia.");
        if (conclusao is null) h.Conclusoes.Add(new HabitoConclusao { Data = data, Concluida = request.Concluida });
        else conclusao.Concluida = request.Concluida;
        await context.SaveChangesAsync();
        await tx.CommitAsync();
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Arquivar(int id)
    {
        await using var tx = await context.Database.BeginTransactionAsync();
        await context.Database.ExecuteSqlInterpolatedAsync($"SELECT pg_advisory_xact_lock({UserId}, {41901})");
        var h = await context.Habitos.FirstOrDefaultAsync(x => x.Id == id && x.UserId == UserId);
        if (h is null) return NotFound();
        h.ArquivadoEm ??= AcompanhamentoRegras.Hoje;
        await context.SaveChangesAsync();
        await tx.CommitAsync();
        return NoContent();
    }

    private static bool Valido(HabitoRequest r) => AcompanhamentoRegras.TextoValido(r.Titulo, 200)
        && Enum.IsDefined(r.Categoria) && r.DiasSemana is { Length: > 0 and <= 7 }
        && r.DiasSemana.All(d => d is >= 0 and <= 6) && AcompanhamentoRegras.DataValida(r.Inicio)
        && (!r.Fim.HasValue || AcompanhamentoRegras.DataValida(r.Fim.Value) && r.Fim >= r.Inicio);

    private static object Resposta(Habito h, DateOnly inicio, DateOnly fim)
    {
        var registradas = h.Conclusoes.Select(c => c.Data).ToHashSet();
        var concluidas = h.Conclusoes.Where(c => c.Concluida).Select(c => c.Data).ToHashSet();
        return new { h.Id, h.Titulo, h.Categoria, h.DiasSemana, h.Inicio, h.Fim,
            Pausado = h.Pausas.Any(p => !p.Fim.HasValue), Arquivado = h.ArquivadoEm.HasValue,
            Ocorrencias = Enumerable.Range(0, fim.DayNumber - inicio.DayNumber + 1).Select(inicio.AddDays)
                .Where(d => registradas.Contains(d) || AcompanhamentoRegras.Agendado(h, d))
                .Select(d => new { Data = d, Concluida = concluidas.Contains(d) }).ToArray() };
    }
}
