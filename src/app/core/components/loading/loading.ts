import { Component, OnDestroy, OnInit } from '@angular/core';

interface IconeFlutuante {
  icone: string;
  cor: 'teal' | 'accent' | 'ink-faint';
  left: string;
  top: string;
  tamanho: string;
  duracao: string;
  atraso: string;
}

const DICAS: readonly string[] = [
  'Guarde pelo menos 10% da sua renda todo mês antes de gastar qualquer coisa.',
  'A regra 50-30-20: 50% para necessidades, 30% para desejos e 20% para poupança.',
  'Um fundo de emergência deve cobrir de 3 a 6 meses das suas despesas fixas.',
  'Juros compostos trabalham a seu favor quando você investe — e contra você quando deve.',
  'Pequenas despesas diárias somam mais do que parecem ao longo de um ano.',
  'Diversificar os investimentos reduz riscos sem precisar sacrificar rentabilidade.',
  'Rever assinaturas e gastos recorrentes mensalmente libera dinheiro sem esforço.',
  'O melhor momento para investir foi ontem. O segundo melhor momento é hoje.'
];

const TROCA_DICA_MS = 4000;

@Component({
  selector: 'app-loading',
  standalone: false,
  styleUrl: './loading.scss',
  templateUrl: './loading.html'
})
export class Loading implements OnInit, OnDestroy {
  readonly icones: readonly IconeFlutuante[] = [
    { icone: 'ti-chart-line', cor: 'teal', left: '8%', top: '18%', tamanho: '18px', duracao: '5.2s', atraso: '0.0s' },
    { icone: 'ti-coin', cor: 'accent', left: '82%', top: '12%', tamanho: '16px', duracao: '4.8s', atraso: '0.7s' },
    { icone: 'ti-piggy-bank', cor: 'ink-faint', left: '15%', top: '72%', tamanho: '20px', duracao: '5.8s', atraso: '1.2s' },
    { icone: 'ti-trending-up', cor: 'teal', left: '88%', top: '65%', tamanho: '16px', duracao: '4.4s', atraso: '0.3s' },
    { icone: 'ti-receipt', cor: 'accent', left: '5%', top: '45%', tamanho: '14px', duracao: '6.0s', atraso: '2.1s' },
    { icone: 'ti-building-bank', cor: 'ink-faint', left: '93%', top: '38%', tamanho: '17px', duracao: '5.5s', atraso: '1.6s' },
    { icone: 'ti-wallet', cor: 'teal', left: '25%', top: '88%', tamanho: '15px', duracao: '4.9s', atraso: '0.9s' },
    { icone: 'ti-chart-bar', cor: 'accent', left: '72%', top: '82%', tamanho: '18px', duracao: '5.3s', atraso: '2.8s' },
    { icone: 'ti-cash', cor: 'ink-faint', left: '42%', top: '6%', tamanho: '14px', duracao: '6.2s', atraso: '1.4s' },
    { icone: 'ti-report-money', cor: 'teal', left: '60%', top: '92%', tamanho: '16px', duracao: '4.6s', atraso: '3.2s' },
    { icone: 'ti-percentage', cor: 'accent', left: '35%', top: '4%', tamanho: '15px', duracao: '5.7s', atraso: '0.5s' },
    { icone: 'ti-currency-dollar', cor: 'ink-faint', left: '78%', top: '28%', tamanho: '13px', duracao: '4.2s', atraso: '2.4s' }
  ];

  dicaAtual = DICAS[0];
  dicaVisivel = true;

  private indiceDica = 0;
  private intervalId?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    this.intervalId = setInterval(() => this.proximaDica(), TROCA_DICA_MS);
  }

  ngOnDestroy(): void {
    clearInterval(this.intervalId);
  }

  private proximaDica(): void {
    this.dicaVisivel = false;
    setTimeout(() => {
      this.indiceDica = (this.indiceDica + 1) % DICAS.length;
      this.dicaAtual = DICAS[this.indiceDica];
      this.dicaVisivel = true;
    }, 520);
  }
}
