using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using ControleGastos.Data;
using ControleGastos.DTOs;
using ControleGastos.Models;
using Microsoft.AspNetCore.Authorization;

namespace ControleGastos.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;

    public AuthController(AppDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

[Authorize]
[HttpGet("me")]
public async Task<IActionResult> Me()
{
    var id = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    var user = await _context.Users.FindAsync(id);

    if (user is null)
        return NotFound();

    return Ok(new { user.Id, user.Nome, user.Email });
}

    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterRequest request)
    {
        var jaExiste = await _context.Users.AnyAsync(u => u.Email == request.Email);
        if (jaExiste)
            return Conflict("Já existe um usuário com esse email.");

        var user = new User
        {
            Nome = request.Nome,
            Email = request.Email
        };

        var hasher = new PasswordHasher<User>();
        user.SenhaHash = hasher.HashPassword(user, request.Senha);

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var token = GerarToken(user);
        return Ok(new AuthResponse(token, user.Nome, user.Email));
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest request)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
        if (user is null)
            return Unauthorized("Email ou senha inválidos.");

        var hasher = new PasswordHasher<User>();
        var resultado = hasher.VerifyHashedPassword(user, user.SenhaHash, request.Senha);
        if (resultado == PasswordVerificationResult.Failed)
            return Unauthorized("Email ou senha inválidos.");

        var token = GerarToken(user);
        return Ok(new AuthResponse(token, user.Nome, user.Email));
    }

    private string GerarToken(User user)
    {
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Name, user.Nome)
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(2),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}