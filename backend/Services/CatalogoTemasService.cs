using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.Extensions.Caching.Memory;

namespace ControleGastos.Services;

public record TemaCatalogo(string Codigo, string Titulo, string? TituloOriginal, string Url, string Fonte);
public class CatalogoTemasException(string mensagem, int status = 503) : Exception(mensagem) { public int Status => status; }

public class CatalogoTemasService(HttpClient http, IMemoryCache cache, TraducaoNutricionalService traducoes)
{
    private const string BaseApi = "https://vocabularies.unesco.org/rest/v1/unesco/";
    private const string BaseUri = "http://vocabularies.unesco.org/thesaurus/";
    private static readonly Regex CodigoValido = new(@"^[A-Za-z0-9.-]{1,80}$", RegexOptions.Compiled);
    private static readonly Uri UrlBase = new("https://vocabularies.unesco.org/thesaurus/");

    public async Task<List<TemaCatalogo>> Buscar(string busca, string idioma, CancellationToken ct)
    {
        var termo = busca.Trim();
        if (idioma == "pt-BR")
        {
            var traduzido = await traducoes.Traduzir([termo], "pt-BR", "en", ct);
            termo = traduzido.GetValueOrDefault(termo, termo);
        }
        var chave = "catalogo:unesco:busca:" + idioma + ":" + termo.ToLowerInvariant();
        if (cache.TryGetValue<List<TemaCatalogo>>(chave, out var existente)) return existente!;

        using var json = await Consultar("search?query=" + Uri.EscapeDataString(termo)
            + "&lang=en&labellang=en&maxhits=12&unique=true&type=skos%3AConcept", ct);
        var itens = json.RootElement.GetProperty("results").EnumerateArray()
            .Select(LerResultado).Where(x => x is not null).Cast<TemaCatalogo>()
            .DistinctBy(x => x.Codigo).ToList();
        itens = await Localizar(itens, idioma, ct);
        cache.Set(chave, itens, TimeSpan.FromHours(12));
        return itens;
    }

    public async Task<List<TemaCatalogo>> Subtemas(string codigo, string idioma, CancellationToken ct)
    {
        if (!CodigoValido.IsMatch(codigo)) throw new CatalogoTemasException("O código do tema não é válido.", 400);
        var chave = "catalogo:unesco:subtemas:" + idioma + ":" + codigo;
        if (cache.TryGetValue<List<TemaCatalogo>>(chave, out var existente)) return existente!;

        var uri = BaseUri + codigo;
        using var json = await Consultar("narrower?uri=" + Uri.EscapeDataString(uri) + "&lang=en", ct);
        var itens = json.RootElement.GetProperty("narrower").EnumerateArray()
            .Select(LerResultado).Where(x => x is not null).Cast<TemaCatalogo>()
            .DistinctBy(x => x.Codigo).Take(40).ToList();
        itens = await Localizar(itens, idioma, ct);
        cache.Set(chave, itens, TimeSpan.FromHours(24));
        return itens;
    }

    private async Task<List<TemaCatalogo>> Localizar(List<TemaCatalogo> itens, string idioma, CancellationToken ct)
    {
        if (idioma == "en-US" || itens.Count == 0) return itens;
        var nomes = itens.Select(x => x.Titulo).Distinct().ToArray();
        var localizados = await traducoes.Traduzir(nomes, "en", "pt-BR", ct);
        return itens.Select(x => x with {
            TituloOriginal = x.Titulo,
            Titulo = localizados.GetValueOrDefault(x.Titulo, x.Titulo)
        }).ToList();
    }

    private static TemaCatalogo? LerResultado(JsonElement item)
    {
        if (!item.TryGetProperty("uri", out var uriElemento) || !item.TryGetProperty("prefLabel", out var nomeElemento)) return null;
        var uri = uriElemento.GetString(); var nome = nomeElemento.GetString()?.Trim();
        if (string.IsNullOrWhiteSpace(uri) || string.IsNullOrWhiteSpace(nome) || !Uri.TryCreate(uri, UriKind.Absolute, out var uriParseada)
            || uriParseada.Host != "vocabularies.unesco.org") return null;
        var codigo = uriParseada.AbsolutePath.Split('/', StringSplitOptions.RemoveEmptyEntries).LastOrDefault();
        if (codigo is null || !CodigoValido.IsMatch(codigo)) return null;
        return new(codigo, nome, null, new Uri(UrlBase, codigo).AbsoluteUri, "UNESCO Thesaurus");
    }

    private async Task<JsonDocument> Consultar(string caminho, CancellationToken ct)
    {
        try
        {
            using var resposta = await http.GetAsync(BaseApi + caminho, ct);
            if (!resposta.IsSuccessStatusCode) throw new CatalogoTemasException("O catálogo de temas está indisponível no momento.");
            return JsonDocument.Parse(await resposta.Content.ReadAsStringAsync(ct));
        }
        catch (HttpRequestException) { throw new CatalogoTemasException("Não foi possível consultar o catálogo de temas. Você ainda pode criar temas manualmente."); }
        catch (TaskCanceledException) when (!ct.IsCancellationRequested) { throw new CatalogoTemasException("A consulta ao catálogo demorou mais que o esperado. Tente novamente."); }
        catch (JsonException) { throw new CatalogoTemasException("O catálogo de temas retornou uma resposta inválida."); }
    }
}
