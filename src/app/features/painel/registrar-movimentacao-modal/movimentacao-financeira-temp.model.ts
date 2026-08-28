// TODO(DFW-1): modelo temporário. Quando `core/models/movimentacao-financeira.model.ts`
// existir (task DFW-1), trocar as importações deste componente para ele e remover este arquivo.
// Os nomes/campos abaixo espelham `RegistrarMovimentacaoRequest` do backend
// (src/DashFinRas/Extensions/Dto/Default/RegistrarMovimentacaoRequest.cs).

export enum TipoMovimentacao {
  Despesa = 0,
  Receita = 1
}

export interface CategoriaResumoDto {
  id: string;
  nome: string;
}

export interface RequestRegistrarMovimentacaoDto {
  idPainel: string;
  tipo: TipoMovimentacao;
  idCategoria: string;
  competencia: number;
  valor: number;
  observacao?: string;
  tags?: string[];
}

export interface ResponseMovimentacaoFinanceiraDto {
  id: string;
  idPainel: string;
  tipo: TipoMovimentacao;
  idCategoria: string;
  competencia: number;
  valor: number;
  observacao?: string;
}
