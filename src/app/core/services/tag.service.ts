import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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

  listar(): Observable<ResponseTagDto[]> {
    return this.http
      .get<{ tags?: ResponseTagDto[] }>(this.baseUrl)
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
