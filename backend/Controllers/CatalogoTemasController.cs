using ControleGastos.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ControleGastos.Controllers;

[Authorize, ApiController, Route("api/estudos/catalogo"), EnableRateLimiting("catalogo-estudos")]
public class CatalogoTemasController(CatalogoTemasService catalogo) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Buscar([FromQuery] string busca, [FromQuery] string idioma = "pt-BR", CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(busca) || busca.Trim().Length is < 2 or > 100)
            return BadRequest("Busque um tema usando de 2 a 100 caracteres.");
        if (idioma is not ("pt-BR" or "en-US")) return BadRequest("Idioma não suportado.");
        try { return Ok(await catalogo.Buscar(busca, idioma, ct)); }
        catch (CatalogoTemasException e) { return StatusCode(e.Status, e.Message); }
    }

    [HttpGet("{codigo}/subtemas")]
    public async Task<IActionResult> Subtemas(string codigo, [FromQuery] string idioma = "pt-BR", CancellationToken ct = default)
    {
        if (idioma is not ("pt-BR" or "en-US")) return BadRequest("Idioma não suportado.");
        try { return Ok(await catalogo.Subtemas(codigo, idioma, ct)); }
        catch (CatalogoTemasException e) { return StatusCode(e.Status, e.Message); }
    }
}
