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
    public async Task<IActionResult> Listar([FromQuery] DateTime? data)
    {
        var atividades = _context.Atividades.Where(a => a.UserId == UserId);

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
        if (string.IsNullOrWhiteSpace(request.Titulo))
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
