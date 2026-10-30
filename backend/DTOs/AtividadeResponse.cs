using ControleGastos.Models;

namespace ControleGastos.DTOs;

public record AtividadeResponse(int Id, string Titulo, DateTime Data, CategoriaAtividade Categoria, bool Concluida);
