import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AgregacaoFinanceiraDto,
  GetMovimentacaoFiltroDto,
  RequestAssociarTagsDto,
  RequestMarcarComoPagoDto,
  RequestRegistrarMovimentacaoDto,
  ResponseMovimentacaoDto,
  ResponseMovimentacoesFinanceirasDto
} from '../models/movimentacao-financeira.model';

function paramsFromFiltro(filtro: GetMovimentacaoFiltroDto): HttpParams {
  let params = new HttpParams();
  Object.entries(filtro).forEach(([chave, valor]) => {
    if (valor !== undefined && valor !== null) {
      params = params.set(chave, String(valor));
    }
  });
  return params;
}

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

  /**
   * Retorna a página de lançamentos que atende ao filtro, com metadados de paginação
   * (`totalRegistros`/`temProximaPagina`) — a API deixou de retornar o histórico inteiro
   * sem limite a partir de 008-limite-consulta-movimentacoes.
   */
  consultar(filtro: GetMovimentacaoFiltroDto): Observable<ResponseMovimentacoesFinanceirasDto> {
    return this.http.get<ResponseMovimentacoesFinanceirasDto>(this.baseUrl, { params: paramsFromFiltro(filtro) });
  }

  /**
   * Aceita o mesmo filtro completo de `consultar` (competência agora opcional) — ver
   * 009-agregacao-movimentacoes-filtro. `pagina`/`tamanhoPagina` do filtro são ignorados pela
   * API nesse endpoint, mas não fazem mal se vierem preenchidos.
   */
  obterAgregacao(filtro: GetMovimentacaoFiltroDto): Observable<AgregacaoFinanceiraDto> {
    return this.http.get<AgregacaoFinanceiraDto>(`${this.baseUrl}/agregacao`, { params: paramsFromFiltro(filtro) });
  }
}
