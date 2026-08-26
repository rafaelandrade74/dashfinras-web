import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  RequestCriarConviteDto,
  ResponseConviteDto,
  ResponseConvitesDto
} from '../models/convite.model';

@Injectable({ providedIn: 'root' })
export class ConviteService {
  private readonly painelUrl = `${environment.apiUrl}/painel`;
  private readonly convitesUrl = `${environment.apiUrl}/convites`;

  constructor(private readonly http: HttpClient) {}

  criarConvite(idPainel: string, dto: RequestCriarConviteDto): Observable<ResponseConviteDto> {
    return this.http.post<ResponseConviteDto>(`${this.painelUrl}/${idPainel}/convites`, dto);
  }

  listarConvites(idPainel: string): Observable<ResponseConvitesDto> {
    return this.http.get<ResponseConvitesDto>(`${this.painelUrl}/${idPainel}/convites`);
  }

  obterConvitePorToken(token: string): Observable<ResponseConviteDto> {
    return this.http.get<ResponseConviteDto>(`${this.convitesUrl}/${token}`);
  }

  aprovarConvite(token: string): Observable<ResponseConviteDto> {
    return this.http.post<ResponseConviteDto>(`${this.convitesUrl}/${token}/aprovar`, {});
  }

  recusarConvite(token: string): Observable<ResponseConviteDto> {
    return this.http.post<ResponseConviteDto>(`${this.convitesUrl}/${token}/recusar`, {});
  }
}
