import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RequestCriarTagDto, ResponseTagDto, ResponseTagsDto } from '../models/tag.model';

@Injectable({ providedIn: 'root' })
export class TagService {
  private readonly baseUrl = `${environment.apiUrl}/tag`;

  constructor(private readonly http: HttpClient) {}

  listarPorPainel(idPainel: string): Observable<ResponseTagsDto> {
    return this.http.get<ResponseTagsDto>(this.baseUrl, { params: { idPainel } });
  }

  criar(tag: RequestCriarTagDto): Observable<ResponseTagDto> {
    return this.http.post<ResponseTagDto>(this.baseUrl, tag);
  }
}
