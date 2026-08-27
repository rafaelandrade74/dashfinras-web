# Quickstart: Validar atualização de status de convite

## Pré-requisitos

- `npm install` já executado
- `src/environments/environment.ts` e `.env` configurados (ver `CLAUDE.md`)
- API (`api-dashfinras`) já atualizada para retornar `StatusConviteExibicao` (Pendente, Aprovado,
  Recusado, Expirado) — ver [contracts/convite-status.md](./contracts/convite-status.md)

## Rodando localmente com autenticação

```bash
npm run start:dev
```

Acesse `https://localhost:4300` (ou a porta configurada), faça login e abra um painel em que você
seja Dono/Administrador.

## Cenário 1 — Rótulos e estilos corretos (US1)

1. No painel, abra "Gerenciar usuários" → aba "Convites".
2. Garanta (via dados de teste na API, ou observando convites reais) que existam convites nos 4
   estados: Pendente, Aprovado, Recusado, Expirado.
3. **Esperado**: cada linha mostra o rótulo em português e a classe visual da tabela em
   [data-model.md](./data-model.md) — sem nenhum rótulo antigo ("Aceito", "Invalidado") e sem duas
   variações diferentes de "Pendente".

## Cenário 2 — Reenvio disponível apenas em Recusado/Expirado (US2)

1. Na mesma aba de convites, localize um convite Recusado e um Expirado.
2. **Esperado**: o botão/ação "Reenviar convite" aparece para ambos.
3. Localize um convite Pendente e um Aprovado.
4. **Esperado**: nenhum dos dois exibe a ação de reenviar.
5. Clique em reenviar em um convite Recusado.
6. **Esperado**: o convite é reenviado com sucesso (mesmo comportamento de antes — `reenviarConvite`
   não muda) e a lista de convites é recarregada.

## Cenário 3 — Status desconhecido não quebra a tela (Edge Case / FR-006)

1. Force (via mock/interceptação de rede no DevTools, ou dado de teste na API) um convite com
   `status` fora dos 4 valores esperados.
2. **Esperado**: a linha desse convite aparece com um rótulo neutro (ex.: "Status desconhecido") em
   vez de a listagem travar, ficar em branco, ou lançar erro no console.

## Testes automatizados

```bash
npm test -- painel-detalhe
```

Cobre o mapeamento `statusInfo()`/`podeReenviar()` para os 4 novos valores e para um valor
desconhecido — ver tarefas de teste em `tasks.md` (gerado por `/speckit-tasks`).
