# Research: Gerenciar usuários do painel

Nenhum item do Technical Context ficou marcado como `NEEDS CLARIFICATION`. Este documento registra
as decisões técnicas tomadas onde havia mais de uma abordagem razoável.

## Decisão 1 — Modal inline no componente, não um componente/rota separado

**Decision**: O modal "Usuários do painel" é implementado como mais um bloco `@if` dentro do
template de `PainelDetalhe` (`painel-detalhe.html`), controlado por um `signal<boolean>`, no mesmo
padrão dos modais "Renomear painel" e "Excluir painel" já existentes ali.

**Rationale**: A issue #23 precisou de um componente/módulo de rota próprio (`ConviteResponder`)
porque aquela tela é pública e acessível por link direto (`/convites/:token`) fora do contexto de
uma sessão de painel. Aqui não há esse requisito — o modal só faz sentido a partir da tela de
detalhe de um painel já carregado, exatamente como "Renomear"/"Excluir". Criar um componente
separado só adicionaria indireção sem benefício (não há reuso do modal em outro lugar).

**Alternatives considered**:
- Componente Angular dedicado (`UsuariosPainelModal`) declarado em `painel-module.ts`: rejeitado
  por enquanto — nenhum outro lugar do app precisa desse modal, e o padrão local já estabelecido
  (Renomear/Excluir) resolve bem. Se um terceiro modal similar aparecer no futuro, extrair um
  componente compartilhado passa a valer a pena.

## Decisão 2 — Origem da lista de usuários exibida

**Decision**: A lista de usuários do modal vem direto de `painel().usuarios` (já carregado por
`PainelService.obterPainel` no `ngOnInit` de `painel-detalhe`), sem nova chamada de API. Após uma
adição bem-sucedida por e-mail de conta já existente, a lista é atualizada re-chamando
`PainelService.obterPainel(id)` (não fazendo append manual no array local), para garantir que o
estado exibido sempre reflita o que a API realmente persistiu.

**Rationale**: Não existe endpoint de listagem de usuários separado do próprio `GET /api/painel/{id}`
— o `ResponsePainelDto` já embute `usuarios: PainelUsuarioDto[]`. Re-buscar o painel inteiro após
adicionar é mais simples e mais correto do que tentar reconstruir localmente o objeto do usuário
recém-adicionado (que exigiria dados — nome, id — que a resposta do convite não necessariamente
carrega da mesma forma que `PainelUsuarioDto`).

**Alternatives considered**:
- Fazer append manual do usuário adicionado ao array local: rejeitado — arriscaria divergir do
  estado real da API (ex.: se a adição na verdade recaiu em convite pendente por e-mail sem conta,
  não haveria usuário nenhum pra adicionar à lista ainda).

## Decisão 3 — Reuso estrito do comportamento de adição por e-mail da issue #23

**Decision**: O bloco de adicionar usuário neste modal chama exatamente `ConviteService.criarConvite`
com o mesmo DTO (`RequestCriarConviteDto: { email, permissao, urlFrontend }`) usado em
`painel-criar.ts`, incluindo as mesmas validações client-side (formato de e-mail, não pode ser o
próprio usuário, não pode duplicar). A única diferença: aqui a validação de duplicidade compara
contra `painel().usuarios` (membros já confirmados), não contra uma lista de pendentes local (que
não existe nesta tela — a adição aqui é imediata, não em lote antes de criar o painel).

**Rationale**: Consistência de comportamento entre os dois pontos de entrada (criar painel vs.
gerenciar painel existente) é um requisito explícito do spec (FR-004) e da issue original. Duplicar
a lógica em vez de reaproveitar o serviço aumentaria o risco de divergência entre as duas telas.

**Alternatives considered**: Nenhuma — é a única opção consistente com FR-004.
