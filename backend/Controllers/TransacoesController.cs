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
public class TransacoesController : ControllerBase
{
    private readonly AppDbContext _context;

    public TransacoesController(AppDbContext context)
    {
        _context = context;
    }

    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<IActionResult> Listar()
    {
        var transacoes = await _context.Transacoes
            .Where(t => t.UserId == UserId)
            .Select(t => new TransacaoResponse(t.Id, t.Descricao, t.Valor, t.Categoria, t.Data, t.Tipo, t.FormaPagamento))
            .ToListAsync();

        return Ok(transacoes);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> ObterPorId(int id)
    {
        var transacao = await _context.Transacoes.FirstOrDefaultAsync(t => t.Id == id && t.UserId == UserId);
        if (transacao is null)
            return NotFound();

        return Ok(new TransacaoResponse(transacao.Id, transacao.Descricao, transacao.Valor, transacao.Categoria, transacao.Data, transacao.Tipo, transacao.FormaPagamento));
    }

    [HttpPost]
    public async Task<IActionResult> Criar(TransacaoRequest request)
    {
        var transacao = new Transacao
        {
            Descricao = request.Descricao,
            Valor = request.Valor,
            Categoria = request.Categoria,
            Data = DateTime.SpecifyKind(request.Data, DateTimeKind.Utc),
            Tipo = request.Tipo,
            FormaPagamento = request.FormaPagamento,
            UserId = UserId
        };

        _context.Transacoes.Add(transacao);
        await _context.SaveChangesAsync();

        var response = new TransacaoResponse(transacao.Id, transacao.Descricao, transacao.Valor, transacao.Categoria, transacao.Data, transacao.Tipo, transacao.FormaPagamento);
        return CreatedAtAction(nameof(ObterPorId), new { id = transacao.Id }, response);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Atualizar(int id, TransacaoRequest request)
    {
        var transacao = await _context.Transacoes.FirstOrDefaultAsync(t => t.Id == id && t.UserId == UserId);
        if (transacao is null)
            return NotFound();

        transacao.Descricao = request.Descricao;
        transacao.Valor = request.Valor;
        transacao.Categoria = request.Categoria;
        transacao.Data = DateTime.SpecifyKind(request.Data, DateTimeKind.Utc);
        transacao.Tipo = request.Tipo;
        transacao.FormaPagamento = request.FormaPagamento;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Deletar(int id)
    {
        var transacao = await _context.Transacoes.FirstOrDefaultAsync(t => t.Id == id && t.UserId == UserId);
        if (transacao is null)
            return NotFound();

        _context.Transacoes.Remove(transacao);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}