# Corrigir legibilidade das dicas na tela de carregamento

- **feature_id**: `07e7f92b-26d4-4dc5-b529-1770e27f356f`
- **project**: dashfinras-web (`dashfinras-web`)
- **slug**: `002-corrigir-legibilidade-das-dicas-na-tela-de-carregamento`
- **status**: done
- **completed_at**: 2026-09-19T01:58:06.539Z
- **PR**: [#52](https://github.com/rafaelandrade74/dashfinras-web/pull/52)

## Specification

```json
{
  "overview": "Na tela de carregamento, a dica financeira aparece quebrada em uma palavra por linha, em uma coluna estreita que sobrepõe o ícone da moeda e o rótulo 'Dica financeira'. A dica deve ser exibida em linhas de largura confortável, centralizada e sem sobrepor outros elementos, e a alternância entre dicas deve atualizar a tela de forma confiável.",
  "edgeCases": [
    "Dica muito longa em tela muito estreita.",
    "Palavra longa sem espaços (ex.: valores monetários ou termos financeiros extensos).",
    "Troca de dica no meio da transição de opacidade.",
    "Zoom do navegador em 200% ou fonte ampliada pelo usuário.",
    "Tela de carregamento exibida em orientação paisagem em celular (pouca altura).",
    "Tela de carregamento removida durante uma troca de dica em andamento (sem erro nem atualização após a saída)."
  ],
  "assumptions": [
    "O escopo cobre a área da dica na tela de carregamento e a confiabilidade da troca de dicas; marca, moeda, barra de progresso e ícones decorativos não mudam.",
    "O conteúdo textual das dicas existentes não é alterado.",
    "A evidência mostra o problema em desktop; presume-se que também ocorra em telas menores e a correção deve cobrir ambos.",
    "Layout, fonte, cores e animações atuais são mantidos; muda apenas a largura/posicionamento do texto e a forma como o estado da dica é atualizado."
  ],
  "userScenarios": [
    "Ao abrir o app (ou navegar entre telas com carregamento), o usuário vê a marca, o indicador de progresso e uma dica financeira legível enquanto espera.",
    "Enquanto a tela permanece visível, as dicas se alternam e cada uma continua legível, com a transição sem 'pulos' de layout nem sobreposição."
  ],
  "successCriteria": [
    {
      "id": "SC-001",
      "text": "100% das dicas existentes são exibidas com no máximo 3 linhas em viewport de 1280px de largura e no máximo 5 linhas em 360px.",
      "measurable": true
    },
    {
      "id": "SC-002",
      "text": "Em nenhuma dica, em nenhum tamanho de tela testado (320px a 1920px), há sobreposição do texto com outros elementos da tela.",
      "measurable": true
    },
    {
      "id": "SC-003",
      "text": "Uma pessoa lê qualquer dica de uma só vez, sem esforço, na comparação visual com a captura de evidência (palavra por linha), que deixa de ocorrer.",
      "measurable": true
    },
    {
      "id": "SC-004",
      "text": "Em 10 minutos de tela de carregamento visível, 100% das trocas de dica programadas aparecem na tela, sem nenhuma dica ficar travada.",
      "measurable": true
    }
  ],
  "acceptanceScenarios": [
    {
      "given": "a tela de carregamento é exibida em desktop",
      "when": "uma dica financeira é mostrada",
      "then": "o texto ocupa poucas linhas (não uma palavra por linha), centralizado abaixo do rótulo 'Dica financeira'"
    },
    {
      "given": "a tela de carregamento é exibida",
      "when": "a dica é exibida",
      "then": "nenhuma parte do texto sobrepõe o ícone da moeda, a barra de progresso ou o rótulo 'Dica financeira'"
    },
    {
      "given": "a tela de carregamento é exibida em tela de celular estreita",
      "when": "uma dica é mostrada",
      "then": "o texto quebra em linhas naturais dentro da largura da tela, sem corte nem rolagem horizontal"
    },
    {
      "given": "existem dicas de tamanhos diferentes",
      "when": "as dicas se alternam",
      "then": "todas permanecem completamente visíveis e os demais elementos da tela não mudam de posição de forma perceptível"
    },
    {
      "given": "o usuário prefere movimento reduzido",
      "when": "a tela de carregamento é exibida",
      "then": "a dica continua legível e posicionada corretamente"
    },
    {
      "given": "a tela de carregamento permanece visível por mais de 4 segundos",
      "when": "o intervalo de troca é atingido",
      "then": "a dica exibida muda de fato na tela, com fade-out e fade-in, sem exigir interação do usuário"
    }
  ],
  "functionalRequirements": [
    {
      "id": "FR-001",
      "text": "A dica financeira deve ser exibida em um bloco de texto com largura suficiente para que frases típicas ocupem no máximo 3 linhas em telas de desktop."
    },
    {
      "id": "FR-002",
      "text": "O texto da dica deve ficar centralizado horizontalmente abaixo do rótulo 'Dica financeira' e nunca sobrepor o ícone da moeda, a barra de progresso ou o rótulo."
    },
    {
      "id": "FR-003",
      "text": "Em telas estreitas (a partir de 320px de largura), a dica deve se ajustar à largura disponível, quebrando por palavras, sem cortar texto nem gerar rolagem horizontal."
    },
    {
      "id": "FR-004",
      "text": "Todas as dicas existentes devem ser exibidas por completo, inclusive as mais longas, sem truncamento."
    },
    {
      "id": "FR-005",
      "text": "A alternância entre dicas (com transição suave) deve ser mantida, sem causar deslocamento perceptível dos demais elementos da tela."
    },
    {
      "id": "FR-006",
      "text": "A correção deve funcionar nos temas/modos já suportados e respeitar a preferência de movimento reduzido."
    },
    {
      "id": "FR-007",
      "text": "A troca automática de dicas deve atualizar a tela de forma confiável a cada intervalo, sem depender de interação do usuário nem de outros eventos para aparecer."
    }
  ]
}
```

## Plan

```json
{
  "technicalContext": {
    "scope": "Componente Loading em src/app/core/components/loading (loading.scss, loading.html, loading.ts, loading.spec.ts). Sem mudança de API, servidor ou dados.",
    "testing": "vitest via ng test; jsdom não calcula layout, então a contagem de linhas por viewport é feita no browser.",
    "language": "TypeScript / Angular (NgModules, zoneless), SCSS",
    "unknowns": [],
    "rootCause": "O .card é flex-column com align-items:center, então .tip-wrap (flex item sem largura explícita) encolhe ao conteúdo. Como seu único filho .tip é position:absolute, o conteúdo em fluxo é zero e .tip-wrap fica com largura ~0. Com isso, .tip (width:320px; max-width:100%) tem max-width resolvido para ~0 e quebra uma palavra por linha, transbordando centralizado sobre a moeda e o rótulo. Além disso, .tip-wrap usa align-items:center, o que centraliza verticalmente o filho absoluto e o faz crescer para cima e para baixo quando o texto tem mais linhas que a altura reservada. Em paralelo, dicaAtual/dicaVisivel são campos comuns alterados em setInterval/setTimeout numa app zoneless, então a troca de dica pode não re-renderizar."
  },
  "constitutionCheck": [
    { "principle": "I. Somente NgModules", "status": "ok", "note": "Nenhum componente novo; Loading permanece standalone:false." },
    { "principle": "II. App zoneless", "status": "ok", "note": "dicaAtual e dicaVisivel passam a signal(); o template lê com dicaAtual() e dicaVisivel(). Cumpre o princípio e o FR-007." },
    { "principle": "III–VIII (BFF, tokens, segredos, environment)", "status": "n/a", "note": "Feature apenas visual e de estado local; nenhum arquivo de ambiente ou servidor tocado." },
    { "principle": "IX. Português", "status": "ok", "note": "Textos das dicas inalterados; commit em português." },
    { "principle": "X. Prettier", "status": "ok", "note": "Rodar prettier nos arquivos alterados." },
    { "principle": "XI. Testes", "status": "ok", "note": "Adaptar os testes existentes para signals e adicionar teste de regressão dos estilos; manter os demais." },
    { "principle": "XII. Fluxo de git", "status": "ok", "note": "Branch fix/<issue>-dica-carregamento a partir da develop atualizada; PR para develop. Não usar feature/manter-se-logado." },
    { "principle": "XIII. Legibilidade e movimento reduzido", "status": "ok", "note": "É o objetivo da feature; o bloco prefers-reduced-motion existente é preservado." }
  ],
  "constitutionCheckPostDesign": "Sem violações após o design. A conversão para signal() resolve a única atenção da primeira passada.",
  "research": [
    {
      "decision": "Corrigir a largura do contêiner da dica em vez de aumentar o width fixo do .tip",
      "rationale": "A causa é o .tip-wrap sem largura; dar width:100% a ele faz o max-width:100% do .tip resolver para a largura do card (até 332px úteis), corrigindo desktop e mobile juntos.",
      "alternatives": [
        "Aumentar width do .tip para px maior (não resolve o max-width:100% de um pai de largura 0)",
        "Trocar o card para align-items:stretch (afeta brand, moeda e barra)"
      ]
    },
    {
      "decision": "Manter o .tip absolutamente posicionado, mas ancorado no topo, com min-height de ~68px (3 linhas)",
      "rationale": "O fade não causa salto de layout e o texto cresce só para baixo, sem invadir o rótulo.",
      "alternatives": [
        "Colocar .tip em fluxo normal (a altura variaria entre dicas e o layout pularia)",
        "Empilhar todas as dicas em grid (reserva a altura da maior, mais complexo)"
      ]
    },
    {
      "decision": "Usar text-wrap: balance com overflow-wrap: anywhere",
      "rationale": "Equilibra as linhas e evita estouro com palavras longas; navegadores sem suporte a balance ignoram a propriedade.",
      "alternatives": ["Sem balance", "hyphens:auto (depende de lang e dicionário)"]
    },
    {
      "decision": "Converter dicaAtual e dicaVisivel para signal() e guardar o id do setTimeout para limpá-lo no ngOnDestroy",
      "rationale": "Atende ao princípio II e ao FR-007. Limpar o timeout evita atualizar o estado depois que o componente sai (caso de borda da spec).",
      "alternatives": [
        "ChangeDetectorRef.markForCheck (mantém campos comuns, contraria o padrão do projeto)",
        "Manter como está (troca pode não re-renderizar)"
      ]
    },
    {
      "decision": "Testes: adaptar os existentes para ler signals e adicionar cobertura de estilos computados e da limpeza do timeout",
      "rationale": "Protege contra regressão da causa raiz e do comportamento de troca; a checagem de linhas por viewport é manual.",
      "alternatives": ["Somente verificação manual"]
    }
  ],
  "dataModel": [],
  "contracts": [
    "Contrato de UI do Loading: brand, moeda, barra de progresso, rótulo 'Dica financeira' e dica em coluna centralizada; a dica nunca sobrepõe os demais; ≤3 linhas a 1280px e ≤5 linhas a 360px.",
    "API do componente: dicaAtual e dicaVisivel são signals somente leitura para o template (dicaAtual(), dicaVisivel()); o texto das dicas não muda."
  ],
  "quickstart": [
    "Pré-requisito: npm install; ambiente conforme CLAUDE.md (sem tocar em environment.ts).",
    "Rodar `npm test` e confirmar que os testes do Loading passam, incluindo os novos.",
    "Rodar `npm run start:dev` e abrir a tela de carregamento (forçando o estado de loading ou com throttling de rede).",
    "Verificar em 1920px, 1280px, 360px e 320px: cada uma das 8 dicas aparece em poucas linhas, centralizada, sem sobrepor a moeda, a barra ou o rótulo.",
    "Aguardar mais de 4s e confirmar que a dica realmente troca na tela, com fade, várias vezes seguidas.",
    "Verificar com zoom de 200% e em paisagem de celular que nada é cortado.",
    "Ativar prefers-reduced-motion no DevTools e confirmar dica visível e bem posicionada.",
    "Conferir que a troca de dica não desloca marca, moeda, barra e rótulo.",
    "Rodar prettier nos arquivos alterados."
  ]
}
```

## Tasks

- [x] **T001** [Setup] Criar branch fix/dica-carregamento a partir da develop atualizada
- [x] **T002** [Setup] Rodar npm test e registrar linha de base dos testes do Loading
- [x] **T003** [US1] Corrigir largura do .tip-wrap e ancoragem do .tip em loading.scss
- [x] **T004** [US1, P] Adicionar teste de regressão dos estilos da dica em loading.spec.ts
- [x] **T005** [US1] Verificar visualmente as 8 dicas em 1920, 1280, 360 e 320px _(fechada a pedido do usuário; não verificada pelo agente)_
- [x] **T006** [US2] Converter dicaAtual e dicaVisivel para signal() em loading.ts
- [x] **T007** [US2] Atualizar loading.html para ler os signals
- [x] **T008** [US2] Adaptar e ampliar testes de troca de dica em loading.spec.ts
- [x] **T009** [US2] Verificar no navegador que a dica troca sozinha várias vezes seguidas _(fechada a pedido do usuário; não verificada pelo agente)_
- [x] **T010** [Polish] Rodar Prettier nos arquivos alterados do Loading _(parcial: só loading.spec.ts está conforme; os demais já estavam fora do padrão antes)_
- [x] **T011** [Polish] Rodar npm test e npm run build completos
- [x] **T012** [Polish] Commitar em português e abrir PR para develop

## Analysis

```json
[
  {
    "area": "Coverage Gaps",
    "severity": "medium",
    "description": "SC-004 exige 100% das trocas em 10 minutos de tela visível, mas a T009 só observa cerca de 12s. Ampliar a verificação manual ou cobrir com teste de timers falsos avançando 10 minutos.",
    "relatedTaskCodes": ["T008", "T009"]
  },
  {
    "area": "Underspecification",
    "severity": "medium",
    "description": "A T004 pede largura computada do .tip-wrap igual à do card, mas o plano reconhece que jsdom não calcula layout (larguras 0). O teste pode passar ou falhar por motivo errado. Definir asserções sobre estilos declarados (ex.: width:100%, position) ou rodar em navegador real.",
    "relatedTaskCodes": ["T004"]
  },
  {
    "area": "Underspecification",
    "severity": "low",
    "description": "T005 e T009 não dizem como provocar a tela de carregamento no navegador; o quickstart só sugere 'forçar o estado de loading ou throttling de rede'. Indicar o procedimento (ex.: throttling no DevTools ou rota/flag que exibe o Loading).",
    "relatedTaskCodes": ["T005", "T009"]
  },
  {
    "area": "Coverage Gaps",
    "severity": "low",
    "description": "O caso de borda 'palavra longa sem espaços' é tratado por overflow-wrap:anywhere na T003, mas nenhuma tarefa de verificação o cobre explicitamente.",
    "relatedTaskCodes": ["T003", "T005"]
  },
  {
    "area": "Ambiguity",
    "severity": "low",
    "description": "FR-001 usa 'frases típicas' e 'largura suficiente', termos vagos; o SC-001 já os torna mensuráveis (≤3 linhas a 1280px), então o risco é baixo.",
    "relatedTaskCodes": ["T003"]
  },
  {
    "area": "Underspecification",
    "severity": "low",
    "description": "T001 e T012 usam o placeholder <issue> no nome da branch; definir o número da issue ou usar nome sem número.",
    "relatedTaskCodes": ["T001", "T012"]
  }
]
```
