import { PainelPermissao } from './painel.model';

export enum StatusConvite {
  PendenteCadastro = 0,
  PendenteAprovacao = 1,
  Concluido = 2,
  Recusado = 3,
  Expirado = 4,
  Invalidado = 5
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
