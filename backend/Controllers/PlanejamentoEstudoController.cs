using System.Security.Claims;
using ControleGastos.Data;
using ControleGastos.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ControleGastos.Controllers;

[Authorize]
[ApiController]
[Route("api/estudos")]
public class PlanejamentoEstudoController(AppDbContext context) : ControllerBase
{
    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    public record MateriaRequest(string Titulo, int PlanoEstudoId);
    public record TopicoRequest(string Titulo, string Status, DateOnly? DataPrevista, string? FonteCatalogo = null, string? CodigoCatalogo = null);

    [HttpGet("planejamento")]
    public async Task<IActionResult> Listar() => Ok(await context.MateriasEstudo
        .Where(x => x.PlanoEstudo.UserId == UserId).OrderBy(x => x.Titulo)
        .Select(x => new {
            x.Id, x.Titulo, x.PlanoEstudoId,
            Topicos = x.Topicos.OrderBy(t => t.DataPrevista == null).ThenBy(t => t.DataPrevista).ThenBy(t => t.Id)
                .Select(t => new { t.Id, t.Titulo, t.Status, t.DataPrevista, t.FonteCatalogo, t.CodigoCatalogo,
                    Minutos = t.Sessoes.Sum(s => s.DuracaoMinutos), Sessoes = t.Sessoes.Count })
        }).ToListAsync());

    [HttpPost("materias")]
    public async Task<IActionResult> CriarMateria(MateriaRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Titulo) || request.Titulo.Trim().Length > 160)
            return BadRequest("Informe uma matéria com até 160 caracteres.");
        if (!await context.PlanosEstudo.AnyAsync(x => x.Id == request.PlanoEstudoId && x.UserId == UserId)) return NotFound();
        var materia = new MateriaEstudo { Titulo = request.Titulo.Trim(), PlanoEstudoId = request.PlanoEstudoId };
        context.MateriasEstudo.Add(materia);
        await context.SaveChangesAsync();
        return Ok(new { materia.Id });
    }

    [HttpDelete("materias/{id:int}")]
    public async Task<IActionResult> ExcluirMateria(int id)
    {
        var materia = await context.MateriasEstudo.FirstOrDefaultAsync(x => x.Id == id && x.PlanoEstudo.UserId == UserId);
        if (materia is null) return NotFound();
        context.MateriasEstudo.Remove(materia);
        await context.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("materias/{id:int}/topicos")]
    public async Task<IActionResult> CriarTopico(int id, TopicoRequest request)
    {
        if (!Valido(request)) return BadRequest("Informe um título com até 200 caracteres e um status válido.");
        if (!await context.MateriasEstudo.AnyAsync(x => x.Id == id && x.PlanoEstudo.UserId == UserId)) return NotFound();
        if (!CatalogoValido(request)) return BadRequest("A origem do tema selecionado não é válida.");
        if (request.FonteCatalogo is not null && await context.TopicosEstudo.AnyAsync(x => x.MateriaEstudoId == id
            && x.FonteCatalogo == request.FonteCatalogo && x.CodigoCatalogo == request.CodigoCatalogo)) return Conflict("Esse tema já está no plano.");
        var topico = new TopicoEstudo { MateriaEstudoId = id, Titulo = request.Titulo.Trim(), Status = request.Status, DataPrevista = request.DataPrevista,
            FonteCatalogo = request.FonteCatalogo, CodigoCatalogo = request.CodigoCatalogo };
        context.TopicosEstudo.Add(topico);
        await context.SaveChangesAsync();
        return Ok(new { topico.Id });
    }

    [HttpPut("topicos/{id:int}")]
    public async Task<IActionResult> AtualizarTopico(int id, TopicoRequest request)
    {
        if (!Valido(request)) return BadRequest("Informe um título com até 200 caracteres e um status válido.");
        var topico = await context.TopicosEstudo.FirstOrDefaultAsync(x => x.Id == id && x.MateriaEstudo.PlanoEstudo.UserId == UserId);
        if (topico is null) return NotFound();
        topico.Titulo = request.Titulo.Trim(); topico.Status = request.Status; topico.DataPrevista = request.DataPrevista;
        await context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("topicos/{id:int}")]
    public async Task<IActionResult> ExcluirTopico(int id)
    {
        var topico = await context.TopicosEstudo.FirstOrDefaultAsync(x => x.Id == id && x.MateriaEstudo.PlanoEstudo.UserId == UserId);
        if (topico is null) return NotFound();
        context.TopicosEstudo.Remove(topico);
        await context.SaveChangesAsync();
        return NoContent();
    }

    private static bool Valido(TopicoRequest request) => !string.IsNullOrWhiteSpace(request.Titulo)
        && request.Titulo.Trim().Length <= 200 && request.Status is "a-estudar" or "em-andamento" or "concluido";
    private static bool CatalogoValido(TopicoRequest request) => request.FonteCatalogo is null && request.CodigoCatalogo is null
        || request.FonteCatalogo == "unesco" && request.CodigoCatalogo is { Length: > 0 and <= 80 }
            && request.CodigoCatalogo.All(c => char.IsAsciiLetterOrDigit(c) || c is '.' or '-');
}
