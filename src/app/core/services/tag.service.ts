import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ResponseTagDto } from '../models/tag.model';

@Injectable({ providedIn: 'root' })
export class TagService {
  private readonly baseUrl = `${environment.apiUrl}/tag`;

  constructor(private readonly http: HttpClient) {}

  /**
   * Lista as tags do painel informado (de qualquer membro, não só do usuário autenticado) —
   * usado para resolver id -> nome na exibição (painel-detalhe.ts, movimentacao-acoes.ts).
   * `idPainel` é obrigatório desde 011-tags-atreladas-ao-painel: a criação e a associação de
   * tags por nome passaram a ser feitas direto pela API (get-or-create escopado ao painel em
   * `MovimentacaoFinanceiraService.associarTags`), então o cliente não resolve mais nome -> id
   * nem cria tags "soltas" por aqui.
   */
  listar(idPainel: string): Observable<ResponseTagDto[]> {
    const params = new HttpParams().set('idPainel', idPainel);
    return this.http
      .get<{ tags?: ResponseTagDto[] }>(this.baseUrl, { params })
      .pipe(map((resposta) => resposta.tags ?? []));
  }
}
