import { PainelPermissao } from './painel.model';

export enum StatusConvite {
  Pendente = 0,
  Aprovado = 1,
  Recusado = 2,
  Expirado = 3
}

export interface RequestCriarConviteDto {
  email: string;
  permissao: PainelPermissao;
  urlFrontend: string;
}

export interface ResponseConviteDto {
  id: string;
  emailConvidado?: string;
  idPainel: string;
  nomePainel?: string;
  permissao: PainelPermissao;
  status: StatusConvite;
  dataCriacao: string;
  dataExpiracao: string;
}

export interface ResponseConvitesDto {
  convites: ResponseConviteDto[];
}
