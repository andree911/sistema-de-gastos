using ControleGastos.Models;

namespace ControleGastos.DTOs;

public record TransacaoResponse(int Id, string Descricao, decimal Valor, string Categoria, DateTime Data, TipoTransacao Tipo, FormaPagamento? FormaPagamento, Moeda Moeda);
