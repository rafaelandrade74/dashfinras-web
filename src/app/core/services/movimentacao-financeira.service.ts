import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  MovimentacaoFinanceiraDto,
  RequestAssociarTagsDto,
  RequestMarcarComoPagoDto
} from '../models/movimentacao-financeira.model';

/**
 * TEMP (DFW-5): implementação compatível com a task DFW-1 (em paralelo), que está criando este
 * mesmo service. Se DFW-1 já tiver mergeado quando esta branch subir, reconciliar os dois
 * arquivos manualmente (conflito de merge esperado neste arquivo) — mantendo a assinatura dos
 * métodos usada pelos componentes de `movimentacao-acoes`.
 */
@Injectable({ providedIn: 'root' })
export class MovimentacaoFinanceiraService {
  private readonly baseUrl = `${environment.apiUrl}/movimentacao-financeira`;

  constructor(private readonly http: HttpClient) {}

  marcarComoPago(id: string, dataPagamento: string): Observable<MovimentacaoFinanceiraDto> {
    return this.http.put<MovimentacaoFinanceiraDto>(
      `${this.baseUrl}/${id}/marcar-como-pago`,
      { dataPagamento } as RequestMarcarComoPagoDto
    );
  }

  associarTags(id: string, tags: string[]): Observable<MovimentacaoFinanceiraDto> {
    return this.http.put<MovimentacaoFinanceiraDto>(
      `${this.baseUrl}/${id}/tags`,
      { tags } as RequestAssociarTagsDto
    );
  }

  cancelar(id: string): Observable<MovimentacaoFinanceiraDto> {
    return this.http.delete<MovimentacaoFinanceiraDto>(`${this.baseUrl}/${id}`);
  }
}
