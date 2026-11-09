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
[Route("api/estudos")]
public class EstudosController : ControllerBase
{
    private readonly AppDbContext _context;

    public EstudosController(AppDbContext context) => _context = context;

    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet("planos")]
    public async Task<IActionResult> ListarPlanos()
    {
        var agora = DateTime.UtcNow;
        var inicioSemana = agora.Date.AddDays(-(((int)agora.DayOfWeek + 6) % 7));
        var fimSemana = inicioSemana.AddDays(7);

        var planos = await _context.PlanosEstudo
            .Where(plano => plano.UserId == UserId)
            .OrderBy(plano => plano.Titulo)
            .Select(plano => new PlanoEstudoResponse(
                plano.Id,
                plano.Titulo,
                plano.Tema,
                plano.Objetivo,
                plano.MetaSessoesSemanais,
                plano.CursoSlug,
                plano.Sessoes.Count(sessao => sessao.Data >= inicioSemana && sessao.Data < fimSemana),
                plano.Sessoes
                    .Where(sessao => sessao.Data >= inicioSemana && sessao.Data < fimSemana)
                    .Sum(sessao => sessao.DuracaoMinutos)))
            .ToListAsync();

        return Ok(planos);
    }

    [HttpPost("planos")]
    public async Task<IActionResult> CriarPlano(PlanoEstudoRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Titulo) || string.IsNullOrWhiteSpace(request.Tema))
            return BadRequest("Informe o título e o tema do plano.");
        if (request.MetaSessoesSemanais is < 1 or > 14)
            return BadRequest("A meta deve ficar entre 1 e 14 sessões por semana.");

        var plano = new PlanoEstudo
        {
            Titulo = request.Titulo.Trim(),
            Tema = request.Tema.Trim(),
            Objetivo = request.Objetivo?.Trim() ?? string.Empty,
            MetaSessoesSemanais = request.MetaSessoesSemanais,
            CursoSlug = request.CursoSlug,
            UserId = UserId,
        };

        _context.PlanosEstudo.Add(plano);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(ListarPlanos), new PlanoEstudoResponse(
            plano.Id, plano.Titulo, plano.Tema, plano.Objetivo, plano.MetaSessoesSemanais, plano.CursoSlug, 0, 0));
    }

    [HttpPut("planos/{id:int}")]
    public async Task<IActionResult> AtualizarPlano(int id, PlanoEstudoRequest request)
    {
        var plano = await _context.PlanosEstudo.FirstOrDefaultAsync(item => item.Id == id && item.UserId == UserId);
        if (plano is null) return NotFound();
        if (string.IsNullOrWhiteSpace(request.Titulo) || string.IsNullOrWhiteSpace(request.Tema))
            return BadRequest("Informe o título e o tema do plano.");
        if (request.MetaSessoesSemanais is < 1 or > 14)
            return BadRequest("A meta deve ficar entre 1 e 14 sessões por semana.");

        plano.Titulo = request.Titulo.Trim();
        plano.Tema = request.Tema.Trim();
        plano.Objetivo = request.Objetivo?.Trim() ?? string.Empty;
        plano.MetaSessoesSemanais = request.MetaSessoesSemanais;
        plano.CursoSlug = request.CursoSlug;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("planos/{id:int}")]
    public async Task<IActionResult> DeletarPlano(int id)
    {
        var plano = await _context.PlanosEstudo.FirstOrDefaultAsync(item => item.Id == id && item.UserId == UserId);
        if (plano is null) return NotFound();

        _context.PlanosEstudo.Remove(plano);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("sessoes")]
    public async Task<IActionResult> ListarSessoes()
    {
        var sessoes = await _context.SessoesEstudo
            .Where(sessao => sessao.UserId == UserId)
            .OrderByDescending(sessao => sessao.Data)
            .Take(100)
            .Select(sessao => new SessaoEstudoResponse(
                sessao.Id,
                sessao.PlanoEstudoId,
                sessao.PlanoEstudo == null ? null : sessao.PlanoEstudo.Titulo,
                sessao.LicaoSlug,
                sessao.Data,
                sessao.DuracaoMinutos,
                sessao.Observacoes,
                sessao.TopicoEstudoId,
                sessao.TopicoEstudo == null ? null : sessao.TopicoEstudo.Titulo))
            .ToListAsync();

        return Ok(sessoes);
    }

    [HttpPost("sessoes")]
    public async Task<IActionResult> CriarSessao(SessaoEstudoRequest request)
    {
        TopicoEstudo? topico = null;
        if (request.TopicoEstudoId.HasValue)
        {
            topico = await _context.TopicosEstudo.Include(x => x.MateriaEstudo)
                .FirstOrDefaultAsync(x => x.Id == request.TopicoEstudoId && x.MateriaEstudo.PlanoEstudo.UserId == UserId);
            if (topico is null || topico.MateriaEstudo.PlanoEstudoId != request.PlanoEstudoId)
                return BadRequest("O tópico deve pertencer ao plano selecionado.");
        }
        if (request.DuracaoMinutos is < 1 or > 1440)
            return BadRequest("A duração deve ficar entre 1 e 1440 minutos.");
        if (request.PlanoEstudoId.HasValue && !await _context.PlanosEstudo
                .AnyAsync(plano => plano.Id == request.PlanoEstudoId && plano.UserId == UserId))
            return NotFound("O plano informado não foi encontrado.");

        var sessao = new SessaoEstudo
        {
            PlanoEstudoId = request.PlanoEstudoId,
            TopicoEstudoId = request.TopicoEstudoId,
            LicaoSlug = request.LicaoSlug,
            Data = DateTime.SpecifyKind(request.Data, DateTimeKind.Utc),
            DuracaoMinutos = request.DuracaoMinutos,
            Observacoes = request.Observacoes?.Trim() ?? string.Empty,
            UserId = UserId,
        };

        _context.SessoesEstudo.Add(sessao);
        if (topico?.Status == "a-estudar") topico.Status = "em-andamento";
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(ListarSessoes), new SessaoEstudoResponse(
            sessao.Id, sessao.PlanoEstudoId, null, sessao.LicaoSlug, sessao.Data, sessao.DuracaoMinutos, sessao.Observacoes));
    }

    [HttpDelete("sessoes/{id:int}")]
    public async Task<IActionResult> DeletarSessao(int id)
    {
        var sessao = await _context.SessoesEstudo.FirstOrDefaultAsync(item => item.Id == id && item.UserId == UserId);
        if (sessao is null) return NotFound();

        _context.SessoesEstudo.Remove(sessao);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("licoes-concluidas")]
    public async Task<IActionResult> ListarLicoesConcluidas()
    {
        var licoes = await _context.LicoesConcluidas
            .Where(licao => licao.UserId == UserId)
            .Select(licao => new LicaoConcluidaResponse(licao.CursoSlug, licao.LicaoSlug, licao.ConcluidaEm))
            .ToListAsync();
        return Ok(licoes);
    }

    [HttpPut("cursos/{cursoSlug}/licoes/{licaoSlug}/conclusao")]
    public async Task<IActionResult> ConcluirLicao(string cursoSlug, string licaoSlug)
    {
        var existe = await _context.LicoesConcluidas.AnyAsync(licao =>
            licao.UserId == UserId && licao.CursoSlug == cursoSlug && licao.LicaoSlug == licaoSlug);
        if (!existe)
        {
            _context.LicoesConcluidas.Add(new LicaoConcluida
            {
                CursoSlug = cursoSlug,
                LicaoSlug = licaoSlug,
                UserId = UserId,
            });
            await _context.SaveChangesAsync();
        }

        return NoContent();
    }

    [HttpDelete("cursos/{cursoSlug}/licoes/{licaoSlug}/conclusao")]
    public async Task<IActionResult> ReabrirLicao(string cursoSlug, string licaoSlug)
    {
        var licao = await _context.LicoesConcluidas.FirstOrDefaultAsync(item =>
            item.UserId == UserId && item.CursoSlug == cursoSlug && item.LicaoSlug == licaoSlug);
        if (licao is not null)
        {
            _context.LicoesConcluidas.Remove(licao);
            await _context.SaveChangesAsync();
        }

        return NoContent();
    }
}
