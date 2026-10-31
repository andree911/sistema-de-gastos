namespace ControleGastos.DTOs;

public record PlanoEstudoRequest(string Titulo, string Tema, string Objetivo, int MetaSessoesSemanais, string? CursoSlug);
