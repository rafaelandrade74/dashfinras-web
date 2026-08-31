export interface ResponseTagDto {
  id: string;
  nome?: string;
  criadoEm: string;
}

export interface ResponseTagsDto {
  tags?: ResponseTagDto[];
}

export interface RequestCriarTagDto {
  idPainel: string;
  nome: string;
}
