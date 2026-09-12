using ControleGastos.Models;

namespace ControleGastos.DTOs;

public record GastoRequest(string Descricao, decimal Valor, string Categoria, DateTime Data, FormaPagamento FormaPagamento);