namespace ControleGastos.DTOs;

public record PlanoEstudoResponse(
    int Id,
    string Titulo,
    string Tema,
    string Objetivo,
    int MetaSessoesSemanais,
    string? CursoSlug,
    int SessoesNaSemana,
    int MinutosNaSemana);
