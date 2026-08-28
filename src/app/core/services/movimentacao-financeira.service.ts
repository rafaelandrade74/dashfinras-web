import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AgregacaoFinanceiraDto,
  GetMovimentacaoFiltroDto,
  RequestAssociarTagsDto,
  RequestMarcarComoPagoDto,
  RequestRegistrarMovimentacaoDto,
  ResponseMovimentacaoDto
} from '../models/movimentacao-financeira.model';

@Injectable({ providedIn: 'root' })
export class MovimentacaoFinanceiraService {
  private readonly baseUrl = `${environment.apiUrl}/movimentacao`;

  constructor(private readonly http: HttpClient) {}

  registrar(dto: RequestRegistrarMovimentacaoDto): Observable<ResponseMovimentacaoDto> {
    return this.http.post<ResponseMovimentacaoDto>(this.baseUrl, dto);
  }

  marcarComoPago(id: string, dataPagamento: string): Observable<ResponseMovimentacaoDto> {
    return this.http.patch<ResponseMovimentacaoDto>(
      `${this.baseUrl}/${id}/marcar-como-pago`,
      { dataPagamento } as RequestMarcarComoPagoDto
    );
  }

  associarTags(id: string, idsTags: string[]): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${id}/tags`, { idsTags } as RequestAssociarTagsDto);
  }

  cancelar(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  consultar(filtro: GetMovimentacaoFiltroDto): Observable<ResponseMovimentacaoDto[]> {
    let params = new HttpParams();
    Object.entries(filtro).forEach(([chave, valor]) => {
      if (valor !== undefined && valor !== null) {
        params = params.set(chave, String(valor));
      }
    });

    return this.http
      .get<{ movimentacoes?: ResponseMovimentacaoDto[] }>(this.baseUrl, { params })
      .pipe(map((resposta) => resposta.movimentacoes ?? []));
  }

  obterAgregacao(competencia: number, idPainel?: string): Observable<AgregacaoFinanceiraDto> {
    let params = new HttpParams().set('competencia', String(competencia));
    if (idPainel) {
      params = params.set('idPainel', idPainel);
    }

    return this.http.get<AgregacaoFinanceiraDto>(`${this.baseUrl}/agregacao`, { params });
  }
}
