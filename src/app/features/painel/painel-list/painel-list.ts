import { Component, OnInit } from '@angular/core';
import { PainelService } from '../../../core/services/painel.service';
import { ResponsePainelDto } from '../../../core/models/painel.model';

@Component({
  selector: 'app-painel-list',
  standalone: false,
  styleUrl: './painel-list.scss',
  templateUrl: './painel-list.html',
})
export class PainelList implements OnInit {
  paineis: ResponsePainelDto[] = [];
  carregando = false;
  colunas = ['nome', 'usuarios'];

  constructor(private readonly painelService: PainelService) {}

  ngOnInit(): void {
    this.carregarPaineis();
  }

  carregarPaineis(): void {
    this.carregando = true;
    this.painelService.obterPaineisPaginado(1, 10).subscribe({
      next: (response) => {
        this.paineis = response.paineis ?? [];
        this.carregando = false;
      },
      error: () => {
        this.carregando = false;
      }
    });
  }
}
