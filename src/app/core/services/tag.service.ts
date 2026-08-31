import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RequestCriarTagDto, ResponseTagDto } from '../models/tag.model';

@Injectable({ providedIn: 'root' })
export class TagService {
  private readonly baseUrl = `${environment.apiUrl}/tag`;

  constructor(private readonly http: HttpClient) {}

  criar(nome: string, idPainel: string): Observable<ResponseTagDto> {
    return this.http.post<ResponseTagDto>(this.baseUrl, { idPainel, nome } as RequestCriarTagDto);
  }

  /** Lista as tags do painel (de qualquer membro) — `idPainel` é obrigatório na API. */
  listar(idPainel: string): Observable<ResponseTagDto[]> {
    const params = new HttpParams().set('idPainel', idPainel);
    return this.http
      .get<{ tags?: ResponseTagDto[] }>(this.baseUrl, { params })
      .pipe(map((resposta) => resposta.tags ?? []));
  }

  /**
   * Resolve uma lista de nomes de tag para os ids reais já existentes no painel
   * (comparação case-insensitive), sem criar nada — usado só para reconciliar localmente
   * `idsTags` (Guid) depois que `MovimentacaoFinanceiraService.associarTags` (que cria as tags
   * que faltarem por nome, no servidor) já concluiu com sucesso.
   */
  mapearIdsPorNome(nomes: string[], idPainel: string): Observable<string[]> {
    if (nomes.length === 0) {
      return of([]);
    }
    return this.listar(idPainel).pipe(
      map((existentes) => {
        const idPorNomeLower = new Map(existentes.map((tag) => [tag.nome.toLowerCase(), tag.id]));
        return nomes
          .map((nome) => idPorNomeLower.get(nome.trim().toLowerCase()))
          .filter((id): id is string => !!id);
      })
    );
  }
}
