import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  RequestAddPainelDto,
  RequestAddUsuarioPainelDto,
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

  deletarPainel(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
