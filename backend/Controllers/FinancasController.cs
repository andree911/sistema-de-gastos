using System.Security.Claims;
using ControleGastos.Data;
using ControleGastos.DTOs;
using ControleGastos.Models;
using ControleGastos.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ControleGastos.Controllers;

[Authorize, ApiController, Route("api/financas")]
public class FinancasController(AppDbContext context) : ControllerBase
{
    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    public record OrcamentoRequest(string Mes, string Categoria, Moeda Moeda, decimal Limite);
    public record RecorrenciaRequest(string Descricao, decimal Valor, string Categoria, Moeda Moeda,
        FormaPagamento? FormaPagamento, int DiaVencimento, string Inicio, string? Fim, bool Ativa);
    public record GerarRequest(string Mes);

    [HttpGet("resumo")]
    public async Task<IActionResult> Resumo([FromQuery] string mes, [FromQuery] Moeda moeda)
    {
        if (!AcompanhamentoRegras.MesValido(mes, out var data) || !Enum.IsDefined(moeda))
            return BadRequest("Informe o mês (AAAA-MM) e uma moeda válida.");
        var inicio = AcompanhamentoRegras.Utc(data); var fim = inicio.AddMonths(1);
        var transacoes = await context.Transacoes.AsNoTracking()
            .Where(t => t.UserId == UserId && t.Data >= inicio && t.Data < fim && t.Moeda == moeda)
            .OrderByDescending(t => t.Data).ThenByDescending(t => t.Id)
            .Select(t => new TransacaoResponse(t.Id, t.Descricao, t.Valor, t.Categoria, t.Data, t.Tipo, t.FormaPagamento, t.Moeda)).ToListAsync();
        var orcamentos = await context.Orcamentos.AsNoTracking().Where(x => x.UserId == UserId && x.Mes == mes && x.Moeda == moeda).ToListAsync();
        var gastos = transacoes.Where(t => t.Tipo == TipoTransacao.Gasto).ToList();
        var categorias = gastos.Select(t => Categoria(t.Categoria)).Union(orcamentos.Select(o => o.Categoria)).Order().Select(c =>
        {
            var gasto = gastos.Where(t => Categoria(t.Categoria) == c).Sum(t => t.Valor);
            decimal? limite = orcamentos.FirstOrDefault(o => o.Categoria == c)?.Limite;
            return new { Categoria = c, Gasto = gasto, Limite = limite, Restante = limite - gasto };
        }).ToArray();
        var totalReceitas = transacoes.Where(t => t.Tipo == TipoTransacao.Receita).Sum(t => t.Valor);
        var totalGastos = gastos.Sum(t => t.Valor);
        return Ok(new { Mes = mes, Moeda = moeda, Receitas = totalReceitas, Gastos = totalGastos,
            Saldo = totalReceitas - totalGastos, Categorias = categorias, Transacoes = transacoes });
    }

    [HttpGet("orcamentos")]
    public async Task<IActionResult> Orcamentos([FromQuery] string mes, [FromQuery] Moeda moeda)
    {
        if (!AcompanhamentoRegras.MesValido(mes, out _) || !Enum.IsDefined(moeda)) return BadRequest("Mês ou moeda inválidos.");
        return Ok(await context.Orcamentos.AsNoTracking().Where(x => x.UserId == UserId && x.Mes == mes && x.Moeda == moeda)
            .OrderBy(x => x.Categoria).Select(x => new { x.Id, x.Mes, x.Categoria, x.Moeda, x.Limite }).ToListAsync());
    }

    [HttpPut("orcamentos")]
    public async Task<IActionResult> SalvarOrcamento(OrcamentoRequest r)
    {
        if (!AcompanhamentoRegras.MesValido(r.Mes, out _) || !Enum.IsDefined(r.Moeda)
            || !AcompanhamentoRegras.TextoValido(r.Categoria, 100) || !AcompanhamentoRegras.ValorValido(r.Limite))
            return BadRequest("Confira o mês, a categoria, a moeda e o limite positivo com até duas casas decimais.");
        var categoria = Categoria(r.Categoria);
        await context.Database.ExecuteSqlInterpolatedAsync($"""
            INSERT INTO "Orcamentos" ("UserId", "Mes", "Categoria", "Moeda", "Limite")
            VALUES ({UserId}, {r.Mes}, {categoria}, {(int)r.Moeda}, {r.Limite})
            ON CONFLICT ("UserId", "Mes", "Moeda", "Categoria") DO UPDATE SET "Limite" = EXCLUDED."Limite"
            """);
        return NoContent();
    }

    [HttpDelete("orcamentos/{id:int}")]
    public async Task<IActionResult> ExcluirOrcamento(int id)
    {
        var o = await context.Orcamentos.FirstOrDefaultAsync(x => x.Id == id && x.UserId == UserId);
        if (o is null) return NotFound();
        context.Orcamentos.Remove(o); await context.SaveChangesAsync(); return NoContent();
    }

    [HttpGet("recorrencias")]
    public async Task<IActionResult> Recorrencias() => Ok(await context.DespesasRecorrentes.AsNoTracking()
        .Where(x => x.UserId == UserId).OrderBy(x => x.DiaVencimento).ThenBy(x => x.Id)
        .Select(x => new { x.Id, x.Descricao, x.Valor, x.Categoria, x.Moeda, x.FormaPagamento, x.DiaVencimento, x.Inicio, x.Fim, x.Ativa }).ToListAsync());

    [HttpPost("recorrencias")]
    public async Task<IActionResult> CriarRecorrencia(RecorrenciaRequest r)
    {
        if (!Valida(r)) return BadRequest("Confira os campos da despesa recorrente. O valor deve ser positivo e o vencimento entre 1 e 31.");
        var d = new DespesaRecorrente { UserId = UserId }; Aplicar(d, r);
        context.DespesasRecorrentes.Add(d); await context.SaveChangesAsync();
        return Ok(new { d.Id });
    }

    [HttpPut("recorrencias/{id:int}")]
    public async Task<IActionResult> EditarRecorrencia(int id, RecorrenciaRequest r)
    {
        if (!Valida(r)) return BadRequest("Confira os campos da despesa recorrente.");
        var d = await context.DespesasRecorrentes.FirstOrDefaultAsync(x => x.Id == id && x.UserId == UserId);
        if (d is null) return NotFound();
        Aplicar(d, r); await context.SaveChangesAsync(); return NoContent();
    }

    [HttpDelete("recorrencias/{id:int}")]
    public async Task<IActionResult> PausarRecorrencia(int id)
    {
        var d = await context.DespesasRecorrentes.FirstOrDefaultAsync(x => x.Id == id && x.UserId == UserId);
        if (d is null) return NotFound();
        d.Ativa = false; await context.SaveChangesAsync(); return NoContent();
    }

    [HttpPost("recorrencias/gerar")]
    public async Task<IActionResult> Gerar(GerarRequest r)
    {
        if (!AcompanhamentoRegras.MesValido(r.Mes, out var mes)) return BadRequest("Informe o mês no formato AAAA-MM.");
        await using var tx = await context.Database.BeginTransactionAsync();
        // Same user/month requests serialize before reading the ledger; this also covers concurrent clicks.
        await context.Database.ExecuteSqlInterpolatedAsync($"SELECT pg_advisory_xact_lock({UserId}, {41902})");
        var definicoes = await context.DespesasRecorrentes.Where(x => x.UserId == UserId && x.Ativa).ToListAsync();
        var existentes = await context.LancamentosRecorrentes.Where(x => x.DespesaRecorrente.UserId == UserId && x.Mes == r.Mes)
            .Select(x => x.DespesaRecorrenteId).ToListAsync();
        var novas = definicoes.Where(d => string.CompareOrdinal(d.Inicio, r.Mes) <= 0
            && (d.Fim is null || string.CompareOrdinal(d.Fim, r.Mes) >= 0) && !existentes.Contains(d.Id)).ToArray();
        foreach (var d in novas)
        {
            var dia = new DateOnly(mes.Year, mes.Month, Math.Min(d.DiaVencimento, DateTime.DaysInMonth(mes.Year, mes.Month)));
            context.Transacoes.Add(new Transacao { UserId = UserId, Descricao = d.Descricao, Valor = d.Valor, Categoria = d.Categoria,
                Moeda = d.Moeda, FormaPagamento = d.FormaPagamento, Tipo = TipoTransacao.Gasto, Data = AcompanhamentoRegras.Utc(dia).AddHours(12) });
            context.LancamentosRecorrentes.Add(new LancamentoRecorrente { DespesaRecorrenteId = d.Id, Mes = r.Mes });
        }
        await context.SaveChangesAsync(); await tx.CommitAsync();
        return Ok(new { Criadas = novas.Length });
    }

    private static string Categoria(string texto) => texto.Trim().ToLowerInvariant();
    private static bool Valida(RecorrenciaRequest r) => AcompanhamentoRegras.TextoValido(r.Descricao, 200)
        && AcompanhamentoRegras.TextoValido(r.Categoria, 100) && AcompanhamentoRegras.ValorValido(r.Valor)
        && Enum.IsDefined(r.Moeda) && (!r.FormaPagamento.HasValue || Enum.IsDefined(r.FormaPagamento.Value))
        && r.DiaVencimento is >= 1 and <= 31 && AcompanhamentoRegras.MesValido(r.Inicio, out _)
        && (r.Fim is null || AcompanhamentoRegras.MesValido(r.Fim, out _) && string.CompareOrdinal(r.Fim, r.Inicio) >= 0);
    private static void Aplicar(DespesaRecorrente d, RecorrenciaRequest r)
    {
        d.Descricao = r.Descricao.Trim(); d.Valor = r.Valor; d.Categoria = r.Categoria.Trim(); d.Moeda = r.Moeda;
        d.FormaPagamento = r.FormaPagamento; d.DiaVencimento = r.DiaVencimento; d.Inicio = r.Inicio; d.Fim = r.Fim; d.Ativa = r.Ativa;
    }
}
