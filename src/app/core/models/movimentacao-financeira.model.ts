export enum TipoMovimentacao {
  Despesa = 0,
  Receita = 1
}

export enum StatusMovimentacao {
  Pendente = 0,
  Pago = 1
}

export interface TagDto {
  id: string;
  idUsuario?: string;
  nome: string;
  criadoEm?: string;
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

export interface RequestAssociarTagsDto {
  idsTags: string[];
}

export interface GetMovimentacaoFiltroDto {
  idPainel?: string;
  competencia?: number;
  idCategoria?: string;
  idTag?: string;
  status?: StatusMovimentacao;
  dataInicio?: string;
  dataFim?: string;
}

export interface AgregacaoFinanceiraDto {
  competencia: number;
  totalReceitas: number;
  totalDespesas: number;
  saldo: number;
}
