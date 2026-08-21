import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AddUserDto, GetUserDto } from '../models/usuario.model';

@Injectable({ providedIn: 'root' })
export class AccountService {
  private readonly baseUrl = `${environment.apiUrl}/account`;

  constructor(private readonly http: HttpClient) {}

  obterUsuario(): Observable<GetUserDto> {
    return this.http.get<GetUserDto>(this.baseUrl);
  }

  adicionarUsuario(usuario: AddUserDto): Observable<GetUserDto> {
    return this.http.post<GetUserDto>(this.baseUrl, usuario);
  }
}
