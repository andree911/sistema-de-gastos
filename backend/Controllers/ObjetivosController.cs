using System.Security.Claims;
using ControleGastos.Data;
using ControleGastos.Models;
using ControleGastos.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ControleGastos.Controllers;

[Authorize, ApiController, Route("api/objetivos")]
public class ObjetivosController(AppDbContext context) : ControllerBase
{
    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    public record ObjetivoRequest(string Titulo, string Tipo, decimal Meta, DateOnly Inicio, DateOnly Fim, Moeda Moeda, decimal ValorManual);

    [HttpGet]
    public async Task<IActionResult> Listar()
    {
        var objetivos = await context.Objetivos.AsNoTracking().Where(x => x.UserId == UserId).OrderBy(x => x.Fim).ToListAsync();
        var respostas = new List<object>();
        foreach (var o in objetivos)
        {
            var inicio = AcompanhamentoRegras.Utc(o.Inicio);
            var fim = AcompanhamentoRegras.Utc(o.Fim.AddDays(1));
            decimal atual = o.Tipo switch
            {
                "estudo" => await context.SessoesEstudo.Where(x => x.UserId == UserId && x.Data >= inicio && x.Data < fim).SumAsync(x => (decimal?)x.DuracaoMinutos) ?? 0,
                "habitos" => await context.HabitosConclusoes.CountAsync(x => x.Habito.UserId == UserId && x.Concluida && x.Data >= o.Inicio && x.Data <= o.Fim),
                "exercicio" => await context.RegistrosSaude.Where(x => x.UserId == UserId && x.Tipo == "exercicio" && x.Data >= o.Inicio && x.Data <= o.Fim).SumAsync(x => (decimal?)x.Quantidade) ?? 0,
                "economia" => await context.Transacoes.Where(x => x.UserId == UserId && x.Moeda == o.Moeda && x.Data >= inicio && x.Data < fim)
                    .SumAsync(x => (decimal?)(x.Tipo == TipoTransacao.Receita ? x.Valor : -x.Valor)) ?? 0,
                _ => o.ValorManual
            };
            respostas.Add(new { o.Id, o.Titulo, o.Tipo, o.Meta, o.Inicio, o.Fim, o.Moeda, o.ValorManual, Atual = atual,
                Progresso = Math.Clamp(decimal.Round(atual / o.Meta * 100, 1), 0, 100),
                Unidade = o.Tipo switch { "estudo" or "exercicio" => "minutos", "habitos" => "conclusões", "economia" => o.Moeda.ToString(), _ => "unidades" } });
        }
        return Ok(respostas);
    }

    [HttpPost]
    public async Task<IActionResult> Criar(ObjetivoRequest r)
    {
        if (!Valido(r)) return BadRequest("Confira o título, tipo, meta, progresso manual e período de até dez anos.");
        var o = new Objetivo { UserId = UserId }; Aplicar(o, r);
        context.Objetivos.Add(o); await context.SaveChangesAsync();
        return Ok(new { o.Id });
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Editar(int id, ObjetivoRequest r)
    {
        if (!Valido(r)) return BadRequest("Confira os campos do objetivo.");
        var o = await context.Objetivos.FirstOrDefaultAsync(x => x.Id == id && x.UserId == UserId);
        if (o is null) return NotFound();
        Aplicar(o, r); await context.SaveChangesAsync(); return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Excluir(int id)
    {
        var o = await context.Objetivos.FirstOrDefaultAsync(x => x.Id == id && x.UserId == UserId);
        if (o is null) return NotFound();
        context.Objetivos.Remove(o); await context.SaveChangesAsync(); return NoContent();
    }

    private static bool Valido(ObjetivoRequest r) => AcompanhamentoRegras.TextoValido(r.Titulo, 200)
        && r.Tipo is "manual" or "estudo" or "habitos" or "exercicio" or "economia"
        && AcompanhamentoRegras.ValorValido(r.Meta) && r.ValorManual >= 0 && r.ValorManual <= 999999999999m && decimal.Round(r.ValorManual, 2) == r.ValorManual
        && Enum.IsDefined(r.Moeda) && AcompanhamentoRegras.DataValida(r.Inicio) && AcompanhamentoRegras.DataValida(r.Fim)
        && r.Fim >= r.Inicio && r.Fim.DayNumber - r.Inicio.DayNumber <= 3660;
    private static void Aplicar(Objetivo o, ObjetivoRequest r)
    {
        o.Titulo = r.Titulo.Trim(); o.Tipo = r.Tipo; o.Meta = r.Meta; o.Inicio = r.Inicio; o.Fim = r.Fim;
        o.Moeda = r.Moeda; o.ValorManual = r.Tipo == "manual" ? r.ValorManual : 0;
    }
}
