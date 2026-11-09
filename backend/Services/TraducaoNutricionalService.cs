using System.Net;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using ControleGastos.Data;
using Microsoft.EntityFrameworkCore;

namespace ControleGastos.Services;

public class TraducaoNutricionalService(HttpClient http, AppDbContext context, IConfiguration configuration)
{
    public async Task<Dictionary<string, string>> Traduzir(IEnumerable<string> textos, string origem, string destino, CancellationToken ct)
    {
        var unicos = textos.Where(x => !string.IsNullOrWhiteSpace(x)).Distinct().ToArray();
        if (origem == destino) return unicos.ToDictionary(x => x, x => x);
        var chaves = unicos.ToDictionary(x => x, x => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(origem + ":" + destino + ":" + x))));
        var ids = chaves.Values.ToArray();
        var salvas = await context.TraducoesNutricionais.AsNoTracking().Where(x => ids.Contains(x.Chave)).ToDictionaryAsync(x => x.Chave, x => x.Traducao, ct);
        var resultado = unicos.Where(x => salvas.ContainsKey(chaves[x])).ToDictionary(x => x, x => salvas[chaves[x]]);
        using var limite = new SemaphoreSlim(3);
        var novas = await Task.WhenAll(unicos.Where(x => !resultado.ContainsKey(x)).Select(async texto => {
            await limite.WaitAsync(ct);
            try { return (texto, traducao: await Consultar(texto, origem, destino, ct)); }
            finally { limite.Release(); }
        }));
        foreach (var (texto, traducao) in novas)
        {
            if (traducao is null) continue;
            resultado[texto] = traducao;
            await context.Database.ExecuteSqlInterpolatedAsync($"""
                INSERT INTO "TraducoesNutricionais" ("Chave", "Original", "Traducao") VALUES ({chaves[texto]}, {texto}, {traducao})
                ON CONFLICT ("Chave") DO NOTHING
                """, ct);
        }
        return resultado;
    }

    private async Task<string?> Consultar(string texto, string origem, string destino, CancellationToken ct)
    {
        if (Encoding.UTF8.GetByteCount(texto) > 500) return null;
        var caminho = "get?q=" + Uri.EscapeDataString(texto) + "&langpair=" + Uri.EscapeDataString(origem + "|" + destino);
        if (configuration["Nutrition:TranslationEmail"] is { Length: > 0 } email) caminho += "&de=" + Uri.EscapeDataString(email);
        try
        {
            using var resposta = await http.GetAsync(caminho, ct);
            if (!resposta.IsSuccessStatusCode) return null;
            using var json = JsonDocument.Parse(await resposta.Content.ReadAsStringAsync(ct));
            if (!json.RootElement.TryGetProperty("responseStatus", out var status) || status.ToString() != "200") return null;
            if (!json.RootElement.TryGetProperty("responseData", out var dados) || !dados.TryGetProperty("translatedText", out var valor)) return null;
            var traduzido = WebUtility.HtmlDecode(valor.GetString())?.Trim();
            return string.IsNullOrWhiteSpace(traduzido) || traduzido.Length > 4000 ? null : traduzido;
        }
        catch (HttpRequestException) { return null; }
        catch (TaskCanceledException) when (!ct.IsCancellationRequested) { return null; }
        catch (JsonException) { return null; }
    }

    public async Task<List<AlimentoNutricional>> Localizar(List<AlimentoNutricional> alimentos, string idioma, CancellationToken ct)
    {
        if (idioma == "en-US") return alimentos;
        var traducoes = await Traduzir(alimentos.SelectMany(x => new[] { x.Nome }.Concat(x.Porcoes.Select(p => p.Nome))), "en", "pt-BR", ct);
        return alimentos.Select(a => a with {
            NomeOriginal = a.Nome, Nome = traducoes.GetValueOrDefault(a.Nome, a.Nome), TraducaoDisponivel = traducoes.ContainsKey(a.Nome),
            Porcoes = a.Porcoes.Select(p => p with { Nome = traducoes.GetValueOrDefault(p.Nome, p.Nome), NomeOriginal = p.Nome, TraducaoDisponivel = traducoes.ContainsKey(p.Nome) }).ToList()
        }).ToList();
    }
}
