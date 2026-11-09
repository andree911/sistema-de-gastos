using System.Globalization;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.Extensions.Caching.Memory;

namespace ControleGastos.Services;

public record PorcaoAlimento(string Nome, decimal Gramas, string? NomeOriginal = null, bool TraducaoDisponivel = true);
public record AlimentoNutricional(int Id, string Nome, decimal Calorias100g, decimal Proteinas100g,
    decimal Carboidratos100g, decimal Gorduras100g, List<PorcaoAlimento> Porcoes, string? NomeOriginal = null, bool TraducaoDisponivel = true)
{
    public string Fonte => "USDA FoodData Central";
    public string Url => $"https://fdc.nal.usda.gov/food-details/{Id}/nutrients";
}
public class AlimentosException(string mensagem, int status = 503) : Exception(mensagem) { public int Status => status; }

public class AlimentosService(HttpClient http, IMemoryCache cache, IConfiguration configuration, IHostEnvironment environment, TraducaoNutricionalService traducoes)
{
    private static readonly HashSet<string> Derivados = [
        "cake", "cakes", "cracker", "crackers", "chips", "snack", "snacks", "cookie", "cookies",
        "cereal", "flour", "puffed", "candy", "bar", "bars", "biscuit", "biscuits", "wafer", "wafers"
    ];
    private static readonly Dictionary<string, string> Termos = new() {
        ["arroz"] = "rice", ["feijao"] = "beans", ["frango"] = "chicken", ["ovo"] = "egg", ["ovos"] = "eggs",
        ["leite"] = "milk", ["aveia"] = "oats", ["maca"] = "apple", ["pao"] = "bread", ["queijo"] = "cheese",
        ["cozido"] = "cooked", ["cozida"] = "cooked", ["cozidos"] = "cooked", ["grelhado"] = "grilled",
        ["assado"] = "roasted", ["branco"] = "white", ["integral"] = "whole", ["cru"] = "raw", ["crua"] = "raw",
        ["batata"] = "potato", ["carne"] = "beef", ["peixe"] = "fish", ["iogurte"] = "yogurt", ["azeite"] = "olive oil",
    };

    public async Task<List<AlimentoNutricional>> Buscar(string busca, CancellationToken ct, string idioma = "pt-BR")
    {
        var normalizada = string.Concat(busca.Normalize(NormalizationForm.FormD).Where(c => CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark)).ToLowerInvariant();
        var query = busca;
        if (idioma == "pt-BR")
        {
            var traducao = await traducoes.Traduzir([busca], "pt-BR", "en", ct);
            query = traducao.GetValueOrDefault(busca) ?? Regex.Replace(normalizada, @"\p{L}+", m => Termos.GetValueOrDefault(m.Value, m.Value));
        }
        var key = "alimentos:busca:" + query;
        if (cache.TryGetValue<List<AlimentoNutricional>>(key, out var existente)) return existente!;
        using var json = await Consultar("foods/search?query=" + Uri.EscapeDataString(query) + "&pageSize=20&dataType=SR%20Legacy&dataType=Foundation", ct);
        var alimentos = new List<AlimentoNutricional>();
        foreach (var item in json.RootElement.GetProperty("foods").EnumerateArray())
        {
            var alimento = Ler(item, false);
            if (alimento is not null) alimentos.Add(alimento);
        }
        alimentos = OrdenarPorRelevancia(alimentos, query);
        cache.Set(key, alimentos, TimeSpan.FromMinutes(30));
        return alimentos;
    }

    private static List<AlimentoNutricional> OrdenarPorRelevancia(List<AlimentoNutricional> alimentos, string consulta)
    {
        static string Normalizar(string texto) => string.Concat(texto.Normalize(NormalizationForm.FormD)
            .Where(c => CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark)).ToLowerInvariant();

        var termos = Regex.Matches(Normalizar(consulta), @"[\p{L}\p{N}]+")
            .Select(m => m.Value).Where(t => t.Length > 1).Distinct().ToArray();
        if (termos.Length == 0) return alimentos;

        return alimentos.Select((alimento, indice) =>
        {
            var nome = Normalizar(alimento.Nome);
            var palavras = Regex.Matches(nome, @"[\p{L}\p{N}]+\b").Select(m => m.Value).ToHashSet();
            var pontuacao = termos.Count(palavras.Contains) * 20;
            pontuacao -= termos.Count(t => !palavras.Contains(t)) * 25;
            if (nome.StartsWith(Normalizar(consulta), StringComparison.Ordinal)) pontuacao += 30;
            if (termos.Length == 1 && palavras.Contains("cooked")) pontuacao += 8;
            foreach (var derivado in Derivados)
                if (!termos.Contains(derivado) && palavras.Contains(derivado)) pontuacao -= 35;
            return (alimento, indice, pontuacao);
        }).OrderByDescending(x => x.pontuacao).ThenBy(x => x.indice).Select(x => x.alimento).ToList();
    }

    public async Task<AlimentoNutricional> Obter(int id, CancellationToken ct)
    {
        var key = "alimentos:detalhe:" + id;
        if (cache.TryGetValue<AlimentoNutricional>(key, out var existente)) return existente!;
        using var json = await Consultar("food/" + id, ct);
        var alimento = Ler(json.RootElement, true) ?? throw new AlimentosException("Este alimento não possui os quatro valores nutricionais necessários.", 422);
        cache.Set(key, alimento, TimeSpan.FromHours(6));
        return alimento;
    }

    private async Task<JsonDocument> Consultar(string caminho, CancellationToken ct)
    {
        var chave = configuration["Nutrition:UsdaApiKey"];
        if (string.IsNullOrWhiteSpace(chave)) chave = environment.IsDevelopment() ? "DEMO_KEY" : null;
        if (chave is null) throw new AlimentosException("A busca de alimentos precisa ser configurada no servidor.");
        using var request = new HttpRequestMessage(HttpMethod.Get, caminho);
        request.Headers.Add("X-Api-Key", chave);
        try
        {
            using var resposta = await http.SendAsync(request, ct);
            if ((int)resposta.StatusCode == 429) throw new AlimentosException("O limite de consultas à base de alimentos foi atingido. Tente novamente mais tarde.", 429);
            if (resposta.StatusCode == System.Net.HttpStatusCode.NotFound) throw new AlimentosException("Alimento não encontrado na base.", 422);
            if (!resposta.IsSuccessStatusCode) throw new AlimentosException("A base de alimentos está indisponível no momento.");
            return JsonDocument.Parse(await resposta.Content.ReadAsStringAsync(ct));
        }
        catch (HttpRequestException) { throw new AlimentosException("Não foi possível consultar a base de alimentos. Tente novamente."); }
        catch (TaskCanceledException) when (!ct.IsCancellationRequested) { throw new AlimentosException("A consulta de alimentos demorou mais que o esperado. Tente novamente."); }
        catch (JsonException) { throw new AlimentosException("A base de alimentos retornou uma resposta inválida."); }
    }

    private static AlimentoNutricional? Ler(JsonElement item, bool detalhe)
    {
        decimal? Nutriente(params int[] ids)
        {
            foreach (var id in ids)
            foreach (var n in item.GetProperty("foodNutrients").EnumerateArray())
            {
                var codigo = detalhe ? n.GetProperty("nutrient").GetProperty("id").GetInt32() : n.GetProperty("nutrientId").GetInt32();
                if (codigo == id && n.TryGetProperty(detalhe ? "amount" : "value", out var v) && v.ValueKind == JsonValueKind.Number && v.TryGetDecimal(out var valor) && valor >= 0) return valor;
            }
            return null;
        }
        var kcal = Nutriente(1008, 2048, 2047); var p = Nutriente(1003); var c = Nutriente(1005); var g = Nutriente(1004);
        if (kcal is null || p is null || c is null || g is null || kcal > 1000 || p > 100 || c > 100 || g > 100) return null;
        var porcoes = new List<PorcaoAlimento>();
        if (detalhe && item.TryGetProperty("foodPortions", out var partes))
        foreach (var parte in partes.EnumerateArray())
        {
            if (!parte.TryGetProperty("gramWeight", out var peso) || !peso.TryGetDecimal(out var gramas) || gramas <= 0 || gramas > 5000) continue;
            var nome = parte.TryGetProperty("portionDescription", out var descricao) ? descricao.GetString() : null;
            if (string.IsNullOrWhiteSpace(nome))
            {
                var unidade = parte.TryGetProperty("measureUnit", out var u) && u.TryGetProperty("name", out var un) ? un.GetString() : null;
                var modificador = parte.TryGetProperty("modifier", out var m) ? m.GetString() : null;
                var quantidade = parte.TryGetProperty("amount", out var a) && a.TryGetDecimal(out var amt) ? amt : 1;
                nome = quantidade.ToString(CultureInfo.InvariantCulture) + " " + (unidade is null or "undetermined" ? modificador : unidade + " " + modificador);
            }
            if (!string.IsNullOrWhiteSpace(nome)) porcoes.Add(new(nome.Trim(), gramas));
        }
        return new(item.GetProperty("fdcId").GetInt32(), item.GetProperty("description").GetString()!, kcal.Value, p.Value, c.Value, g.Value, porcoes);
    }
}
