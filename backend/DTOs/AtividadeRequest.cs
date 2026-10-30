using ControleGastos.Models;

namespace ControleGastos.DTOs;

public record AtividadeRequest(string Titulo, DateTime Data, CategoriaAtividade Categoria, bool Concluida = false);
