/**
 * TEMP (DFW-5): modelo compatível com o que a task DFW-1 (em paralelo) está criando em
 * `src/app/core/models/movimentacao-financeira.model.ts`. Se DFW-1 já tiver mergeado quando
 * esta branch subir, reconciliar os dois arquivos manualmente (o merge do Git vai conflitar
 * neste arquivo) — os nomes/campos abaixo foram escolhidos para bater com o
 * `data-model.md` do backend (`specs/003-financial-data-model`).
 */

export enum StatusMovimentacaoFinanceira {
  Pendente = 0,
  Pago = 1,
  Cancelado = 2
}

export interface MovimentacaoFinanceiraDto {
  id: string;
  idPainel: string;
  descricao: string;
  categoria?: string;
  competencia: string;
  valor: number;
  status: StatusMovimentacaoFinanceira;
  tags?: string[];
  ativo: boolean;
  dataPagamento?: string;
}

export interface RequestMarcarComoPagoDto {
  dataPagamento: string;
}

export interface RequestAssociarTagsDto {
  tags: string[];
}
