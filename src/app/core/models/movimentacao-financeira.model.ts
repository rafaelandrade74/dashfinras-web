export enum TipoMovimentacao {
  Despesa = 0,
  Receita = 1
}

export enum StatusMovimentacao {
  Pendente = 0,
  Pago = 1
}

export interface ResponseMovimentacaoDto {
  id: string;
  idPainel: string;
  tipo: TipoMovimentacao;
  idCategoria: string;
  competencia: number;
  valor: number;
  status: StatusMovimentacao;
  dataPagamento?: string;
  observacao?: string;
  ativo: boolean;
  dataCancelamento?: string;
  criadoPor: string;
  criadoEm: string;
  alteradoPor?: string;
  alteradoEm?: string;
  idsTags?: string[];
}

export interface RequestRegistrarMovimentacaoDto {
  idPainel: string;
  tipo: TipoMovimentacao;
  idCategoria: string;
  competencia: number;
  valor: number;
  observacao?: string;
}

export interface RequestMarcarComoPagoDto {
  dataPagamento: string;
}

/**
 * A API resolve por nome (get-or-create escopado ao painel da movimentação, trim +
 * case-insensitive) desde 011-tags-atreladas-ao-painel — o cliente não resolve mais
 * nome -> id antes de associar.
 */
export interface RequestAssociarTagsDto {
  nomes: string[];
}

export interface GetMovimentacaoFiltroDto {
  idPainel?: string;
  competencia?: number;
  idCategoria?: string;
  idTag?: string;
  status?: StatusMovimentacao;
  dataInicio?: string;
  dataFim?: string;
  /** 1-based. Ver ResponseMovimentacoesFinanceirasDto — API pagina a partir de 008-limite-consulta-movimentacoes. */
  pagina?: number;
  /** Padrão da API: 50. Máximo: 200. */
  tamanhoPagina?: number;
}

export interface ResponseMovimentacoesFinanceirasDto {
  movimentacoes: ResponseMovimentacaoDto[];
  /** Total de registros que atendem ao filtro, ignorando a paginação. */
  totalRegistros: number;
  /** Indica se existem registros além da página atual. */
  temProximaPagina: boolean;
}

export interface AgregacaoFinanceiraDto {
  /** Reflete o filtro aplicado — null quando nenhuma competência foi informada (009-agregacao-movimentacoes-filtro). */
  competencia: number | null;
  totalReceitas: number;
  totalDespesas: number;
  saldo: number;
  quantidadeEntradas: number;
  quantidadeSaidas: number;
}
