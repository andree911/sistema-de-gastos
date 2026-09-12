using ControleGastos.Models;

namespace ControleGastos.DTOs;

public record TransacaoRequest(string Descricao, decimal Valor, string Categoria, DateTime Data, TipoTransacao Tipo, FormaPagamento? FormaPagamento, Moeda Moeda);
