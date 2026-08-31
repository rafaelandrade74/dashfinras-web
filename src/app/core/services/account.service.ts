import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AddUserDto, GetUserDto } from '../models/usuario.model';

@Injectable({ providedIn: 'root' })
export class AccountService {
  private readonly baseUrl = `${environment.apiUrl}/account`;
  private readonly usuarioAtualSubject = new BehaviorSubject<GetUserDto | undefined>(undefined);

  readonly usuarioAtual$: Observable<GetUserDto | undefined> =
    this.usuarioAtualSubject.asObservable();

  constructor(private readonly http: HttpClient) {}

  get usuarioAtual(): GetUserDto | undefined {
    return this.usuarioAtualSubject.value;
  }

  obterUsuario(): Observable<GetUserDto> {
    return this.http
      .get<GetUserDto>(this.baseUrl)
      .pipe(tap((usuario) => this.usuarioAtualSubject.next(usuario)));
  }

  adicionarUsuario(usuario: AddUserDto): Observable<GetUserDto> {
    return this.http
      .post<GetUserDto>(this.baseUrl, usuario)
      .pipe(tap((salvo) => this.usuarioAtualSubject.next(salvo)));
  }
}
