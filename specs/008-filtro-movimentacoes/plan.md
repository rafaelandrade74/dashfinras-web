# Implementation Plan: Barra de filtros de movimentações

**Branch**: `dfw-3-barra-de-filtros-competencia-categoria-status-ta` | **Spec**: [spec.md](./spec.md)

**Status**: Implemented (documentação retroativa — commit `1976fdf`)

## Resumo técnico

Componente Angular não-standalone `app-filtro-movimentacoes`, criado em `src/app/features/painel/filtro-movimentacoes/`, declarado no `PainelModule`. Mantém estado 100% local via `signal()` (competência, categoria, status, tags, campo de nova tag) e expõe um único `@Output() filtroAlterado: EventEmitter<FiltroMovimentacoesDto>`, emitido a cada mudança efetiva de estado. Não possui dependência de serviço, repositório ou chamada HTTP — é uma peça de apresentação pura, para ser embutida pela tela de listagem de movimentações (DFW-2), que decide o que fazer com o filtro emitido (chamar API, filtrar em memória, etc.).

## Decisões de design

### 1. Fidelidade ao esboço aprovado

A disposição dos campos (competência → categoria → status → tags → botão "Limpar filtros", em linha, com quebra responsiva via `flex-wrap`) segue exatamente a seção de filtros do esboço visual aprovado previamente pelo usuário
(artifact: `https://claude.ai/code/artifact/81943ab3-7fbd-4ced-9a47-2a1c90a82c80`).
Não houve desvio de layout, nomenclatura de campos ou ordem visual em relação ao esboço — a implementação é uma tradução direta do mockup para HTML/SCSS/TS.

### 2. Reaproveitamento dos tokens visuais de `painel-detalhe.scss`

Em vez de introduzir uma nova paleta ou novos tokens CSS, `filtro-movimentacoes.scss` reutiliza, em `:host`, exatamente o mesmo conjunto de custom properties já definido em
`src/app/features/painel/painel-detalhe/painel-detalhe.scss`:

```
--paper, --paper-raised, --rule, --ink, --ink-soft, --ink-faint,
--accent, --accent-strong, --accent-wash, --teal, --teal-wash
```

com os mesmos valores hexadecimais/rgba. Essa decisão evita duplicar decisões de design (cores, espaçamentos, tipografia `IBM Plex Sans`/`Fraunces`) em um novo sistema de tokens paralelo, e garante que o componente de filtros se pareça visualmente com o restante da tela de detalhe do painel onde será embutido, sem acoplamento de código (os tokens são redefinidos localmente em `:host`, não importados/herdados — o componente continua reutilizável fora desse contexto específico se necessário).

### 3. Estado em `signal()`, não Reactive Forms

A aplicação roda em modo zoneless; o padrão adotado em componentes recentes do módulo Painel é usar `signal()` para estado local reativo em vez de `FormGroup`. Foi mantida a mesma convenção aqui para consistência arquitetural, evitando introduzir Reactive Forms apenas para este componente (nenhum caso de validação complexa ou two-way binding avançado que justificasse o custo extra).

### 4. Chips-input como interação customizada, não biblioteca de terceiros

O comportamento de tags (adicionar via Enter, remover via botão ou Backspace) foi implementado manualmente em `onTagInputKeydown()`/`adicionarTag()`/`removerTag()`, sem dependência de terceiros (ex.: `ngx-chips`), seguindo a regra do projeto de priorizar soluções sem dependências desnecessárias para uma interação simples e totalmente controlável em ~20 linhas de TypeScript.

## Estrutura de arquivos entregue

```
src/app/features/painel/filtro-movimentacoes/
├── filtro-movimentacoes.ts       (105 linhas) — componente, DTO, lógica de estado
├── filtro-movimentacoes.html     (56 linhas)  — template
├── filtro-movimentacoes.scss     (132 linhas) — estilos, tokens de painel-detalhe.scss
└── filtro-movimentacoes.spec.ts  (203 linhas) — testes unitários (Vitest)

src/app/features/painel/painel-module.ts        — declaração do componente no módulo
```

## Fora de escopo desta entrega

- Integração com API real de movimentações (consumo do `filtroAlterado` pela tela de listagem — DFW-2).
- Persistência do filtro entre sessões/navegações.
- Debounce nos campos de texto (competência, tag) — não solicitado no esboço aprovado.
- Validação de formato de competência.

## Riscos e mitigação

- **Risco**: divergência visual futura se `painel-detalhe.scss` mudar seus tokens sem atualizar `filtro-movimentacoes.scss` (tokens duplicados, não compartilhados via arquivo comum). **Mitigação aceita nesta entrega**: nenhuma — os dois arquivos permanecem sincronizados manualmente; extração para um arquivo de tokens compartilhado fica como possível melhoria futura, fora do escopo de DFW-3.
