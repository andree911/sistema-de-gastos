using ControleGastos.Models;

namespace ControleGastos.DTOs;

public record GastoResponse(int Id, string Descricao, decimal Valor, string Categoria, DateTime Data, FormaPagamento FormaPagamento);