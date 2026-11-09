namespace ControleGastos.DTOs;

public record SessaoEstudoRequest(int? PlanoEstudoId, string? LicaoSlug, DateTime Data, int DuracaoMinutos, string? Observacoes, int? TopicoEstudoId = null);
