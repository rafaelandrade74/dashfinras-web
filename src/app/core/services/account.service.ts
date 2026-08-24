import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AddUserDto, GetUserDto } from '../models/usuario.model';

interface LoginRequestDto {
  accessToken: string;
  refreshToken: string;
}

@Injectable({ providedIn: 'root' })
export class AccountService {
  private readonly baseUrl = `${environment.apiUrl}/account`;
  private readonly usuarioAtualSubject = new BehaviorSubject<GetUserDto | undefined>(undefined);

  readonly usuarioAtual$: Observable<GetUserDto | undefined> = this.usuarioAtualSubject.asObservable();

  constructor(private readonly http: HttpClient) {}

  get usuarioAtual(): GetUserDto | undefined {
    return this.usuarioAtualSubject.value;
  }

  obterUsuario(): Observable<GetUserDto> {
    return this.http.get<GetUserDto>(this.baseUrl).pipe(tap((usuario) => this.usuarioAtualSubject.next(usuario)));
  }

  adicionarUsuario(usuario: AddUserDto): Observable<GetUserDto> {
    return this.http.post<GetUserDto>(this.baseUrl, usuario).pipe(tap((salvo) => this.usuarioAtualSubject.next(salvo)));
  }

  /**
   * Troca o access_token/refresh_token do Supabase por cookies httpOnly setados pela API.
   * O AccessPolicy do endpoint exige o Authorization: Bearer <accessToken> — o mesmo token que
   * vira cookie na resposta — por isso o header é anexado aqui, e não pelo interceptor global.
   */
  login(tokens: LoginRequestDto): Observable<void> {
    const headers = new HttpHeaders({ Authorization: `Bearer ${tokens.accessToken}` });
    return this.http.post<void>(`${this.baseUrl}/login`, tokens, { headers });
  }

  logout(): Observable<void> {
    this.usuarioAtualSubject.next(undefined);
    return this.http.post<void>(`${this.baseUrl}/logout`, {});
  }
}
