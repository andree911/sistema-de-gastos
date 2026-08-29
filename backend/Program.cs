using Microsoft.EntityFrameworkCore;
using ControleGastos.Data;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AppDbContext>(opt =>
    opt.UseNpgsql(
        builder.Configuration.GetConnectionString("Default")
        ?? throw new InvalidOperationException("ConnectionStrings:Default não configurada")));

var app = builder.Build();

app.MapGet("/", () => "API de controle de gastos");

app.Run();