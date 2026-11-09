using Microsoft.EntityFrameworkCore;
using ControleGastos.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using ControleGastos.Services;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AppDbContext>(opt =>
    opt.UseNpgsql(
        builder.Configuration.GetConnectionString("Default")
        ?? throw new InvalidOperationException("ConnectionStrings:Default não configurada")));

var jwtKey = builder.Configuration["Jwt:Key"]!;
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
        policy.WithOrigins("http://localhost:4200", "http://127.0.0.1:4200", "https://frontend-sandy-eight-67.vercel.app")
              .AllowAnyHeader()
              .AllowAnyMethod());
});

builder.Services.AddAuthorization();
builder.Services.AddMemoryCache();
builder.Services.AddHttpClient<TraducaoNutricionalService>(client => { client.BaseAddress = new Uri("https://api.mymemory.translated.net/"); client.Timeout = TimeSpan.FromSeconds(8); });
builder.Services.AddHttpClient<CatalogoTemasService>(client => { client.Timeout = TimeSpan.FromSeconds(12); });
builder.Services.AddHttpClient<AlimentosService>(client => {
    client.BaseAddress = new Uri("https://api.nal.usda.gov/fdc/v1/");
    client.Timeout = TimeSpan.FromSeconds(20);
});
builder.Services.AddRateLimiter(options => {
    options.RejectionStatusCode = 429;
    options.AddFixedWindowLimiter("alimentos", limiter => { limiter.PermitLimit = 20; limiter.Window = TimeSpan.FromMinutes(1); limiter.QueueLimit = 0; });
    options.AddFixedWindowLimiter("catalogo-estudos", limiter => { limiter.PermitLimit = 30; limiter.Window = TimeSpan.FromMinutes(1); limiter.QueueLimit = 0; });
});
builder.Services.AddControllers();

var app = builder.Build();

app.UseCors("Frontend");
app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();
app.MapControllers();

if (app.Environment.IsProduction())
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
}

app.MapGet("/", () => "API de controle de gastos");

app.Run();
