using ControleGastos.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ControleGastos.Controllers;

[Authorize, ApiController, Route("api/saude/alimentos"), EnableRateLimiting("alimentos")]
public class AlimentosController(AlimentosService service, TraducaoNutricionalService traducoes) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Buscar([FromQuery] string busca, CancellationToken ct, [FromQuery] string idioma = "pt-BR")
    {
        if (string.IsNullOrWhiteSpace(busca) || busca.Trim().Length is < 2 or > 100) return BadRequest("Busque um alimento usando de 2 a 100 caracteres.");
        if (idioma is not ("pt-BR" or "en-US")) return BadRequest("Idioma não suportado.");
        try { return Ok(await traducoes.Localizar(await service.Buscar(busca.Trim(), ct, idioma), idioma, ct)); }
        catch (AlimentosException e) { return StatusCode(e.Status, e.Message); }
    }
    [HttpGet("{id:int}")]
    public async Task<IActionResult> Obter(int id, CancellationToken ct, [FromQuery] string idioma = "pt-BR")
    {
        if (id <= 0) return BadRequest();
        if (idioma is not ("pt-BR" or "en-US")) return BadRequest("Idioma não suportado.");
        try { return Ok((await traducoes.Localizar([await service.Obter(id, ct)], idioma, ct))[0]); }
        catch (AlimentosException e) { return StatusCode(e.Status, e.Message); }
    }
}
