import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { RequestRegistrarMovimentacaoDto, ResponseMovimentacaoFinanceiraDto } from './movimentacao-financeira-temp.model';

// TODO(DFW-1): serviço temporário, escopado a este componente. Quando
// `core/services/movimentacao-financeira.service.ts` existir (task DFW-1), trocar a
// injeção deste componente para o serviço real (mesma assinatura de `registrar`) e
// remover este arquivo.
@Injectable({ providedIn: 'root' })
export class MovimentacaoFinanceiraTempService {
  private readonly baseUrl = `${environment.apiUrl}/movimentacao-financeira`;

  constructor(private readonly http: HttpClient) {}

  registrar(dto: RequestRegistrarMovimentacaoDto): Observable<ResponseMovimentacaoFinanceiraDto> {
    return this.http.post<ResponseMovimentacaoFinanceiraDto>(this.baseUrl, dto);
  }
}
