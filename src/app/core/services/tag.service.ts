import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, forkJoin, map, of, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RequestCriarTagDto, ResponseTagDto } from '../models/tag.model';

@Injectable({ providedIn: 'root' })
export class TagService {
  private readonly baseUrl = `${environment.apiUrl}/tag`;

  constructor(private readonly http: HttpClient) {}

  criar(nome: string): Observable<ResponseTagDto> {
    return this.http.post<ResponseTagDto>(this.baseUrl, { nome } as RequestCriarTagDto);
  }

  /**
   * Sem `idPainel`: tags do usuário autenticado (comportamento atual, usado por
   * `resolverIdsPorNome` ao criar/associar tag). Com `idPainel`: tags associadas a lançamentos
   * desse painel, de qualquer membro — necessário para que um convidado resolva nomes de tags
   * criadas pelo dono/outros membros (ver specs/010-tags-painel-compartilhado). Enviar
   * `idPainel` é seguro mesmo contra uma API que ainda não suporte o parâmetro: query strings
   * desconhecidas são ignoradas pelo backend.
   */
  listar(idPainel?: string): Observable<ResponseTagDto[]> {
    const params = idPainel ? new HttpParams().set('idPainel', idPainel) : undefined;
    return this.http
      .get<{ tags?: ResponseTagDto[] }>(this.baseUrl, { params })
      .pipe(map((resposta) => resposta.tags ?? []));
  }

  /**
   * Resolve uma lista de nomes de tag para ids reais: reaproveita tags já existentes do
   * usuário (comparação case-insensitive) e cria as que ainda não existem. Necessário
   * porque a UI ainda trabalha com texto livre para tags, mas a API só aceita idsTags
   * (Guid) em MovimentacaoFinanceiraService.associarTags.
   */
  resolverIdsPorNome(nomes: string[]): Observable<string[]> {
    const vistos = new Set<string>();
    const unicos: string[] = [];
    for (const nome of nomes) {
      const limpo = nome.trim();
      const chave = limpo.toLowerCase();
      if (!limpo || vistos.has(chave)) {
        continue;
      }
      vistos.add(chave);
      unicos.push(limpo);
    }
    if (unicos.length === 0) {
      return of([]);
    }

    return this.listar().pipe(
      switchMap((existentes) => {
        const idPorNomeLower = new Map(existentes.map((tag) => [tag.nome.toLowerCase(), tag.id]));
        const chamadas = unicos.map((nome) => {
          const idExistente = idPorNomeLower.get(nome.toLowerCase());
          return idExistente ? of(idExistente) : this.criar(nome).pipe(map((tag) => tag.id));
        });
        return forkJoin(chamadas);
      })
    );
  }
}
