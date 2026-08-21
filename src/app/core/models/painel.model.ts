export enum PainelPermissao {
  Dono = 0,
  Administrador = 1,
  Membro = 2,
  Visualizador = 3
}

export interface PainelUsuarioDto {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  idPermissao?: PainelPermissao;
  noPermissao?: string;
}

export interface ResponsePainelDto {
  id: string;
  nome?: string;
  usuarios?: PainelUsuarioDto[];
}

export interface ResponsePaineisDto {
  paineis?: ResponsePainelDto[];
  page: number;
  pageSize: number;
}

export interface RequestAddUsuarioPainelDto {
  id: string;
  permissao: PainelPermissao;
}

export interface RequestAddPainelDto {
  nome: string;
  usuarios?: RequestAddUsuarioPainelDto[];
}

export interface RequestUpdatePainelDto {
  id: string;
  nome: string;
}
