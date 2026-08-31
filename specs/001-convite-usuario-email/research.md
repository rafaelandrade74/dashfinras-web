# Research: Convite de usuário por e-mail

Nenhum item do Technical Context ficou marcado como `NEEDS CLARIFICATION`. Este documento registra
as decisões técnicas tomadas para as escolhas onde havia mais de uma abordagem razoável.

## Decisão 1 — Quando disparar os convites na criação do painel

**Decision**: Criar o painel primeiro via `POST /api/painel` (contrato inalterado, sem `usuarios`),
e só então, com o `id` retornado, disparar um `POST /api/painel/{id}/convites` por e-mail pendente
na lista, sequencialmente ou em paralelo via `forkJoin`.

**Rationale**: `POST /api/painel/{id}/convites` exige o `id` do painel na URL — não existe (e a
issue #23 explicitamente tira do escopo) um jeito de criar painel + convites por e-mail em uma
única chamada. `RequestAddPainelDto.usuarios` (o array existente) espera `RequestAddUsuarioPainelDto
{ id, permissao }`, ou seja, IDs de conta já conhecidos — não serve para convite por e-mail. Então o
fluxo por e-mail é necessariamente uma segunda etapa de chamadas após a criação do painel.

**Alternatives considered**:
- Bloquear a UI até todos os convites serem confirmados um a um (sequencial): rejeitado por ser mais
  lento sem benefício — os convites são independentes entre si.
- Pedir ao backend um endpoint batch de convites: fora de escopo (issue #23 não inclui mudança de
  backend) e desnecessário para o volume esperado (poucos convites por criação de painel).
- **Escolhido**: disparar todos os `POST .../convites` em paralelo (`forkJoin`) após o painel ser
  criado, e tratar falhas por e-mail individualmente (ver Decisão 3).

## Decisão 2 — Rota pública `/convites/:token` e autenticação

**Decision**: Nova rota de nível de app (`app-routing-module.ts`), fora do guard
`authGuard → accountGuard` usado por `/paineis`, carregando um módulo lazy `ConviteModule` próprio.
O componente da tela consulta `GET /api/convites/{token}` (que a documentação da API descreve como
"sem autenticação", apesar do bloco `security: [Bearer]` do OpenAPI) e, somente ao clicar em
Aceitar/Recusar sem sessão ativa, redireciona para `/login?redirectUrl=/convites/:token`, reusando
o mecanismo já existente em `authGuard`.

**Rationale**: O padrão de guard existente (`authGuard` no `AppRoutingModule`) é feito para módulos
que exigem sessão desde a entrada — não é o caso aqui, onde a visualização é pública e só a decisão
exige login. Reaproveitar o redirect por querystring já usado em `AuthService`/`authGuard` evita
criar um segundo mecanismo de "volta pós-login".

**Alternatives considered**:
- Aplicar `authGuard` diretamente na rota `/convites/:token`: rejeitado — forçaria login antes mesmo
  de a pessoa ver do que se trata o convite, piorando a experiência descrita na User Story 2.
- Colocar a tela de convite dentro do módulo `painel` (autenticado): rejeitado — o acesso inicial ao
  link precisa funcionar para quem ainda não tem conta nenhuma (fluxo de cadastro), então não pode
  depender do guard de painel.

## Decisão 3 — Tratamento de erro por convite individual

**Decision**: Ao falhar o envio de um convite específico (dentre vários) na criação do painel, o
painel já foi criado com sucesso — a falha não deve bloquear a navegação para o painel criado. A
tela mostra uma mensagem informando quais e-mails falharam e sugere reenviá-los pela aba "Convites
enviados" (US4/FR-019), em vez de tentar reverter a criação do painel.

**Rationale**: Reverter a criação do painel por causa de um convite que falhou seria uma
complexidade desnecessária (o endpoint de deletar painel existe, mas usar rollback client-side para
um efeito colateral de terceiros é frágil) e contraria FR-006/FR-007, que tratam convite como
consequência da criação, não como parte atômica dela.

**Alternatives considered**:
- Rollback automático (deletar painel se algum convite falhar): rejeitado por fragilidade e por não
  refletir a intenção do usuário, que queria o painel criado independentemente do resultado dos
  convites individuais.
- Silenciar falhas de convite sem informar o usuário: rejeitado — viola FR-021 (comunicar falhas de
  forma amigável).

## Decisão 4 — Reenvio de convite (FR-019)

**Decision**: "Reenviar" chama novamente `POST /api/painel/{id}/convites` com o mesmo e-mail/papel
do convite original. Não há endpoint dedicado de "reenvio" no backend — reenviar é, do ponto de
vista de contrato, criar um novo convite para o mesmo destinatário.

**Rationale**: O swagger não expõe um endpoint específico de reenvio; `POST .../convites` já é
idempotente o suficiente do ponto de vista de UX (gera novo token/expiração). Isso é consistente com
a Assumption já registrada no spec de que o convite mais recente prevalece como referência ativa.

**Alternatives considered**: Nenhuma — é a única opção compatível com os endpoints existentes sem
mudança de backend.
