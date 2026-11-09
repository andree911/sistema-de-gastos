namespace ControleGastos.DTOs;

public record SessaoEstudoResponse(
    int Id,
    int? PlanoEstudoId,
    string? PlanoTitulo,
    string? LicaoSlug,
    DateTime Data,
    int DuracaoMinutos,
    string Observacoes,
    int? TopicoEstudoId = null,
    string? TopicoTitulo = null);
