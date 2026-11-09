using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ControleGastos.Data;
using ControleGastos.DTOs;
using ControleGastos.Models;

namespace ControleGastos.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class AtividadesController : ControllerBase
{
    private readonly AppDbContext _context;

    public AtividadesController(AppDbContext context)
    {
        _context = context;
    }

    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<IActionResult> Listar([FromQuery] DateTime? data, [FromQuery] DateTime? inicio, [FromQuery] DateTime? fim)
    {
        var atividades = _context.Atividades.Where(a => a.UserId == UserId);
        if (inicio.HasValue || fim.HasValue)
        {
            if (!inicio.HasValue || !fim.HasValue || fim.Value.Date < inicio.Value.Date || (fim.Value.Date - inicio.Value.Date).TotalDays > 30)
                return BadRequest("Informe um período de até 31 dias.");
            var de = DateTime.SpecifyKind(inicio.Value.Date, DateTimeKind.Utc);
            var ate = DateTime.SpecifyKind(fim.Value.Date.AddDays(1), DateTimeKind.Utc);
            atividades = atividades.Where(a => a.Data >= de && a.Data < ate);
        }

        if (data.HasValue)
        {
            var dia = DateTime.SpecifyKind(data.Value.Date, DateTimeKind.Utc);
            atividades = atividades.Where(a => a.Data.Date == dia);
        }

        var resposta = await atividades
            .OrderBy(a => a.Concluida)
            .ThenBy(a => a.Data)
            .Select(a => new AtividadeResponse(a.Id, a.Titulo, a.Data, a.Categoria, a.Concluida))
            .ToListAsync();

        return Ok(resposta);
    }

    [HttpPost]
    public async Task<IActionResult> Criar(AtividadeRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Titulo) || request.Titulo.Trim().Length > 200 || !Enum.IsDefined(request.Categoria))
            return BadRequest("O tÃ­tulo da atividade Ã© obrigatÃ³rio.");

        var atividade = new Atividade
        {
            Titulo = request.Titulo.Trim(),
            Data = DateTime.SpecifyKind(request.Data, DateTimeKind.Utc),
            Categoria = request.Categoria,
            Concluida = request.Concluida,
            UserId = UserId
        };

        _context.Atividades.Add(atividade);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(Listar), new { id = atividade.Id },
            new AtividadeResponse(atividade.Id, atividade.Titulo, atividade.Data, atividade.Categoria, atividade.Concluida));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Atualizar(int id, AtividadeRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Titulo) || request.Titulo.Trim().Length > 200 || !Enum.IsDefined(request.Categoria))
            return BadRequest("Informe um título de até 200 caracteres e uma área válida.");
        var atividade = await _context.Atividades.FirstOrDefaultAsync(a => a.Id == id && a.UserId == UserId);
        if (atividade is null)
            return NotFound();

        atividade.Titulo = request.Titulo.Trim();
        atividade.Data = DateTime.SpecifyKind(request.Data, DateTimeKind.Utc);
        atividade.Categoria = request.Categoria;
        atividade.Concluida = request.Concluida;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Deletar(int id)
    {
        var atividade = await _context.Atividades.FirstOrDefaultAsync(a => a.Id == id && a.UserId == UserId);
        if (atividade is null)
            return NotFound();

        _context.Atividades.Remove(atividade);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
