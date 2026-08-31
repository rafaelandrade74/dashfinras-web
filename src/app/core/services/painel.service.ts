import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  PainelPermissao,
  RequestAddPainelDto,
  RequestAddUsuarioPainelDto,
  RequestEditarPermissaoUsuarioPainelDto,
  RequestUpdatePainelDto,
  ResponsePaineisDto,
  ResponsePainelDto
} from '../models/painel.model';

@Injectable({ providedIn: 'root' })
export class PainelService {
  private readonly baseUrl = `${environment.apiUrl}/painel`;

  constructor(private readonly http: HttpClient) {}

  obterPainel(id: string): Observable<ResponsePainelDto> {
    return this.http.get<ResponsePainelDto>(`${this.baseUrl}/${id}`);
  }

  obterPaineisPaginado(page: number, pageSize: number): Observable<ResponsePaineisDto> {
    return this.http.get<ResponsePaineisDto>(this.baseUrl, { params: { page, pageSize } });
  }

  adicionarPainel(painel: RequestAddPainelDto): Observable<ResponsePainelDto> {
    return this.http.post<ResponsePainelDto>(this.baseUrl, painel);
  }

  atualizarPainel(painel: RequestUpdatePainelDto): Observable<ResponsePainelDto> {
    return this.http.put<ResponsePainelDto>(this.baseUrl, painel);
  }

  adicionarUsuarioPainel(id: string, usuarios: RequestAddUsuarioPainelDto[]): Observable<ResponsePainelDto> {
    return this.http.put<ResponsePainelDto>(`${this.baseUrl}/${id}/adicionar-usuario`, usuarios);
  }

  removerUsuarioPainel(idPainel: string, idUsuario: string): Observable<ResponsePainelDto> {
    return this.http.delete<ResponsePainelDto>(`${this.baseUrl}/${idPainel}/usuario/${idUsuario}`);
  }

  editarPermissaoUsuarioPainel(
    idPainel: string,
    idUsuario: string,
    permissao: PainelPermissao
  ): Observable<ResponsePainelDto> {
    return this.http.put<ResponsePainelDto>(
      `${this.baseUrl}/${idPainel}/usuario/${idUsuario}/permissao`,
      { permissao } as RequestEditarPermissaoUsuarioPainelDto
    );
  }

  deletarPainel(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
