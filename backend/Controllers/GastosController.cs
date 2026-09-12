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
public class GastosController : ControllerBase
{
    private readonly AppDbContext _context;

    public GastosController(AppDbContext context)
    {
        _context = context;
    }

    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<IActionResult> Listar()
    {
        var gastos = await _context.Gastos
            .Where(g => g.UserId == UserId)
            .Select(g => new GastoResponse(g.Id, g.Descricao, g.Valor, g.Categoria, g.Data, g.FormaPagamento))
            .ToListAsync();

        return Ok(gastos);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> ObterPorId(int id)
    {
        var gasto = await _context.Gastos.FirstOrDefaultAsync(g => g.Id == id && g.UserId == UserId);
        if (gasto is null)
            return NotFound();

        return Ok(new GastoResponse(gasto.Id, gasto.Descricao, gasto.Valor, gasto.Categoria, gasto.Data, gasto.FormaPagamento));
    }

    [HttpPost]
    public async Task<IActionResult> Criar(GastoRequest request)
    {
        var gasto = new Gasto
        {
            Descricao = request.Descricao,
            Valor = request.Valor,
            Categoria = request.Categoria,
            Data = DateTime.SpecifyKind(request.Data, DateTimeKind.Utc),
            FormaPagamento = request.FormaPagamento,
            UserId = UserId
        };

        _context.Gastos.Add(gasto);
        await _context.SaveChangesAsync();

        var response = new GastoResponse(gasto.Id, gasto.Descricao, gasto.Valor, gasto.Categoria, gasto.Data, gasto.FormaPagamento);
        return CreatedAtAction(nameof(ObterPorId), new { id = gasto.Id }, response);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Atualizar(int id, GastoRequest request)
    {
        var gasto = await _context.Gastos.FirstOrDefaultAsync(g => g.Id == id && g.UserId == UserId);
        if (gasto is null)
            return NotFound();

        gasto.Descricao = request.Descricao;
        gasto.Valor = request.Valor;
        gasto.Categoria = request.Categoria;
        gasto.Data = DateTime.SpecifyKind(request.Data, DateTimeKind.Utc);
        gasto.FormaPagamento = request.FormaPagamento;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Deletar(int id)
    {
        var gasto = await _context.Gastos.FirstOrDefaultAsync(g => g.Id == id && g.UserId == UserId);
        if (gasto is null)
            return NotFound();

        _context.Gastos.Remove(gasto);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}