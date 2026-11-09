using System.Security.Claims;
using ControleGastos.Data;
using ControleGastos.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ControleGastos.Services;

namespace ControleGastos.Controllers;

[Authorize]
[ApiController]
[Route("api/saude")]
public class SaudeController(AppDbContext context, AlimentosService alimentos, TraducaoNutricionalService traducoes) : ControllerBase
{
    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    public record DiarioRequest(int? SonoMinutos, int? Passos, int? Disposicao, string? Observacoes);
    public record ItemRequest(int AlimentoId, decimal Gramas, int? ItemId = null);
    public record RegistroRequest(DateOnly Data, string Tipo, string? Descricao, int? Quantidade, int? Calorias, List<ItemRequest>? Alimentos = null);
    public record ItemResponse(int Id, int AlimentoId, string Nome, decimal Gramas, decimal Calorias100g, decimal Proteinas100g, decimal Carboidratos100g, decimal Gorduras100g,
        decimal Calorias, decimal Proteinas, decimal Carboidratos, decimal Gorduras, string? NomeOriginal = null, bool TraducaoDisponivel = true);
    public record RegistroResponse(int Id, DateOnly Data, string Tipo, string Descricao, int? Quantidade, int? Calorias, List<ItemResponse> Alimentos);
    public record ResumoResponse(DateOnly Data, int? SonoMinutos, int? Passos, int? Disposicao, string Observacoes,
        int AguaMl, int ExercicioMinutos, int Refeicoes, int CaloriasInformadas, bool TemCaloriasInformadas, bool TemRegistro,
        decimal? Proteinas, decimal? Carboidratos, decimal? Gorduras, int RefeicoesSemAlimentos);

    [HttpGet("dias/{data}")]
    public async Task<IActionResult> Dia(DateOnly data, CancellationToken ct, [FromQuery] string idioma = "pt-BR")
    {
        var diario = await context.DiariosSaude.AsNoTracking().FirstOrDefaultAsync(x => x.UserId == UserId && x.Data == data);
        var entidades = await context.RegistrosSaude.AsNoTracking().Include(x => x.Alimentos).Where(x => x.UserId == UserId && x.Data == data).OrderByDescending(x => x.Id).ToListAsync();
        var registros = entidades.Select(Resposta).ToList();
        if (idioma is not ("pt-BR" or "en-US")) return BadRequest("Idioma não suportado.");
        if (idioma == "pt-BR")
        {
            var nomes = await traducoes.Traduzir(registros.SelectMany(r => r.Alimentos.Select(x => x.Nome)), "en", "pt-BR", ct);
            registros = registros.Select(r => r with { Alimentos = r.Alimentos.Select(x => x with { NomeOriginal = x.Nome, Nome = nomes.GetValueOrDefault(x.Nome, x.Nome), TraducaoDisponivel = nomes.ContainsKey(x.Nome) }).ToList() }).ToList();
        }
        return Ok(new { Resumo = Resumo(data, diario, registros), Registros = registros });
    }

    [HttpGet("historico")]
    public async Task<IActionResult> Historico([FromQuery] DateOnly inicio, [FromQuery] DateOnly fim)
    {
        if (inicio == default || fim == default || fim < inicio || fim.DayNumber - inicio.DayNumber > 30)
            return BadRequest("Informe um período de até 31 dias.");
        var diarios = await context.DiariosSaude.AsNoTracking().Where(x => x.UserId == UserId && x.Data >= inicio && x.Data <= fim).ToDictionaryAsync(x => x.Data);
        var entidades = await context.RegistrosSaude.AsNoTracking().Include(x => x.Alimentos).Where(x => x.UserId == UserId && x.Data >= inicio && x.Data <= fim).ToListAsync();
        var registros = entidades.Select(Resposta).ToList();
        var porData = registros.ToLookup(x => x.Data);
        return Ok(Enumerable.Range(0, fim.DayNumber - inicio.DayNumber + 1).Select(i => {
            var data = inicio.AddDays(i); return Resumo(data, diarios.GetValueOrDefault(data), porData[data].ToList());
        }));
    }

    [HttpPut("dias/{data}")]
    public async Task<IActionResult> SalvarDiario(DateOnly data, DiarioRequest request)
    {
        if (data == default || request.SonoMinutos is < 0 or > 1440 || request.Passos is < 0 or > 200000
            || request.Disposicao is < 1 or > 5 || (request.Observacoes?.Length ?? 0) > 2000)
            return BadRequest("Confira o sono, os passos, a disposição e o tamanho das observações.");
        // PostgreSQL upsert keeps the unique daily record safe when two requests arrive together.
        await context.Database.ExecuteSqlInterpolatedAsync($"""
            INSERT INTO "DiariosSaude" ("UserId", "Data", "SonoMinutos", "Passos", "Disposicao", "Observacoes")
            VALUES ({UserId}, {data}, {request.SonoMinutos}, {request.Passos}, {request.Disposicao}, {request.Observacoes ?? ""})
            ON CONFLICT ("UserId", "Data") DO UPDATE SET
              "SonoMinutos" = EXCLUDED."SonoMinutos", "Passos" = EXCLUDED."Passos",
              "Disposicao" = EXCLUDED."Disposicao", "Observacoes" = EXCLUDED."Observacoes"
            """);
        return NoContent();
    }

    [HttpPost("registros")]
    public async Task<IActionResult> Criar(RegistroRequest request, CancellationToken ct)
    {
        if (!Valido(request)) return BadRequest("Confira os campos do registro de saúde.");
        var registro = new RegistroSaude { UserId = UserId };
        Aplicar(registro, request);
        try { await PrepararAlimentos(registro, request, ct); }
        catch (AlimentosException e) { return StatusCode(e.Status, e.Message); }
        context.RegistrosSaude.Add(registro);
        await context.SaveChangesAsync();
        return Ok(new { registro.Id });
    }

    [HttpPut("registros/{id:int}")]
    public async Task<IActionResult> Editar(int id, RegistroRequest request, CancellationToken ct)
    {
        if (!Valido(request)) return BadRequest("Confira os campos do registro de saúde.");
        var registro = await context.RegistrosSaude.Include(x => x.Alimentos).FirstOrDefaultAsync(x => x.Id == id && x.UserId == UserId);
        if (registro is null) return NotFound();
        Aplicar(registro, request);
        try { await PrepararAlimentos(registro, request, ct); }
        catch (AlimentosException e) { return StatusCode(e.Status, e.Message); }
        await context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("registros/{id:int}")]
    public async Task<IActionResult> Excluir(int id)
    {
        var registro = await context.RegistrosSaude.FirstOrDefaultAsync(x => x.Id == id && x.UserId == UserId);
        if (registro is null) return NotFound();
        context.RegistrosSaude.Remove(registro);
        await context.SaveChangesAsync();
        return NoContent();
    }

    private static bool Valido(RegistroRequest r) => r.Data != default && (r.Descricao?.Length ?? 0) <= 300
        && (r.Alimentos?.Count ?? 0) <= 20 && (r.Tipo == "refeicao" || !(r.Alimentos?.Any() ?? false))
        && (r.Alimentos?.All(x => x is not null && x.AlimentoId > 0 && x.Gramas is > 0 and <= 5000 && x.Gramas * 100 == decimal.Truncate(x.Gramas * 100)) ?? true) && (r.Tipo switch {
        "agua" => r.Quantidade is >= 1 and <= 20000 && r.Calorias is null,
        "exercicio" => r.Quantidade is >= 1 and <= 1440 && !string.IsNullOrWhiteSpace(r.Descricao) && r.Calorias is null,
        "refeicao" => !string.IsNullOrWhiteSpace(r.Descricao) && r.Quantidade is null && (r.Calorias is null or >= 0 and <= 20000),
        _ => false
    });
    private static void Aplicar(RegistroSaude destino, RegistroRequest r)
    {
        destino.Data = r.Data; destino.Tipo = r.Tipo; destino.Descricao = r.Descricao?.Trim() ?? "";
        destino.Quantidade = r.Quantidade; destino.Calorias = r.Calorias;
    }

    private async Task PrepararAlimentos(RegistroSaude registro, RegistroRequest r, CancellationToken ct)
    {
        var novos = new List<ItemRefeicao>();
        foreach (var pedido in r.Alimentos ?? [])
        {
            AlimentoNutricional alimento;
            if (pedido.ItemId.HasValue)
            {
                var anterior = registro.Alimentos.FirstOrDefault(x => x.Id == pedido.ItemId && x.AlimentoId == pedido.AlimentoId)
                    ?? throw new AlimentosException("Um dos alimentos não pertence a esta refeição.", 400);
                alimento = new(anterior.AlimentoId, anterior.Nome, anterior.Calorias100g, anterior.Proteinas100g, anterior.Carboidratos100g, anterior.Gorduras100g, []);
            }
            else alimento = await alimentos.Obter(pedido.AlimentoId, ct);
            novos.Add(new ItemRefeicao { AlimentoId = alimento.Id, Nome = alimento.Nome, Gramas = pedido.Gramas,
                Calorias100g = decimal.Round(alimento.Calorias100g, 4), Proteinas100g = decimal.Round(alimento.Proteinas100g, 4),
                Carboidratos100g = decimal.Round(alimento.Carboidratos100g, 4), Gorduras100g = decimal.Round(alimento.Gorduras100g, 4) });
        }
        registro.Alimentos.Clear();
        foreach (var item in novos) registro.Alimentos.Add(item);
        if (novos.Count > 0) registro.Calorias = (int)decimal.Round(novos.Sum(x => Valor(x.Calorias100g, x.Gramas)), 0, MidpointRounding.AwayFromZero);
    }
    private static decimal Valor(decimal base100g, decimal gramas) => decimal.Round(base100g * gramas / 100, 2, MidpointRounding.AwayFromZero);
    private static RegistroResponse Resposta(RegistroSaude r) => new(r.Id, r.Data, r.Tipo, r.Descricao, r.Quantidade, r.Calorias,
        r.Alimentos.OrderBy(x => x.Id).Select(x => new ItemResponse(x.Id, x.AlimentoId, x.Nome, x.Gramas, x.Calorias100g, x.Proteinas100g, x.Carboidratos100g, x.Gorduras100g,
            Valor(x.Calorias100g, x.Gramas), Valor(x.Proteinas100g, x.Gramas), Valor(x.Carboidratos100g, x.Gramas), Valor(x.Gorduras100g, x.Gramas))).ToList());
    private static ResumoResponse Resumo(DateOnly data, DiarioSaude? d, List<RegistroResponse> registros) => new(
        data, d?.SonoMinutos, d?.Passos, d?.Disposicao, d?.Observacoes ?? "",
        registros.Where(x => x.Tipo == "agua").Sum(x => x.Quantidade ?? 0),
        registros.Where(x => x.Tipo == "exercicio").Sum(x => x.Quantidade ?? 0),
        registros.Count(x => x.Tipo == "refeicao"), registros.Sum(x => x.Calorias ?? 0), registros.Any(x => x.Calorias.HasValue),
        registros.Count > 0 || d?.SonoMinutos != null || d?.Passos != null || d?.Disposicao != null || !string.IsNullOrEmpty(d?.Observacoes),
        registros.Any(x => x.Alimentos.Count > 0) ? registros.Sum(x => x.Alimentos.Sum(a => a.Proteinas)) : null,
        registros.Any(x => x.Alimentos.Count > 0) ? registros.Sum(x => x.Alimentos.Sum(a => a.Carboidratos)) : null,
        registros.Any(x => x.Alimentos.Count > 0) ? registros.Sum(x => x.Alimentos.Sum(a => a.Gorduras)) : null,
        registros.Count(x => x.Tipo == "refeicao" && x.Alimentos.Count == 0));
}
