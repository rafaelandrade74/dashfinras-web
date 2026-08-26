# Feature Specification: CTA da página inicial reflete sessão ativa

**Feature Branch**: `004-login-painel-cta`

**Created**: 2026-08-26

**Status**: Draft

**Input**: User description: "localizei um bug ao entrar no site pela pagina inicial mesmo estando logado o botão me direciona para o login e dentro do login tenho q informar meu usuário e senha, mas se eu não informar e voltar para pagina inicial aparece para eu clicar no painel ao inves de logar oq era para aparecer logo no começo já que tenho um token de autenticação, então mesmo q por algum motivo o usuário salvou a pagina do login nos favoritos e ele estiver já logado eu preciso q ele seja redirecionado para pagina do painel, porém se ele entrar pela pagina inicial devera aparecer no nome do botão de login se estiver logado mostrar o texto de Painel e se não o Entrar"

## Clarifications

### Session 2026-08-26

- Q: Quando um usuário já logado abre a página de login com um parâmetro `redirectUrl` na URL (ex.: `/login?redirectUrl=/paineis/123`), ele deve ser enviado para essa `redirectUrl` específica, ou sempre para o painel padrão? → A: Respeitar o `redirectUrl` quando presente (senão usar `/paineis`), mas apenas se for uma URL interna da aplicação — nunca redirecionar para uma URL externa.
- Q: Enquanto o sistema ainda está verificando se o usuário tem sessão válida, o que o botão da página inicial deve mostrar? → A: Manter "Entrar" como padrão durante o carregamento; atualiza para "Painel" quando a verificação concluir.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Botão da página inicial reflete a sessão (Priority: P1)

Um usuário já autenticado (possui uma sessão válida) acessa a página inicial do site. O botão de acesso deve mostrar "Painel" (em vez de "Entrar") e, ao ser clicado, deve levá-lo diretamente ao painel, sem passar pela tela de login.

**Why this priority**: É o bug relatado diretamente pelo usuário — hoje o botão sempre direciona ao login mesmo com sessão ativa, forçando uma etapa desnecessária e confusa.

**Independent Test**: Fazer login, navegar até a página inicial e verificar que o botão exibe "Painel" e que o clique leva ao painel sem exigir credenciais novamente.

**Acceptance Scenarios**:

1. **Given** o usuário está autenticado (sessão válida), **When** ele acessa a página inicial, **Then** o botão exibe o texto "Painel".
2. **Given** o usuário está autenticado e vê o botão "Painel" na página inicial, **When** ele clica no botão, **Then** é levado diretamente ao painel, sem passar pela tela de login.
3. **Given** o usuário não está autenticado, **When** ele acessa a página inicial, **Then** o botão exibe o texto "Entrar" e o clique leva à tela de login.

---

### User Story 2 - Acesso direto à página de login com sessão ativa (Priority: P1)

Um usuário já autenticado acessa a URL de login diretamente (por exemplo, por um favorito salvo anteriormente). Em vez de exibir o formulário de login, o sistema deve redirecioná-lo automaticamente para o painel, já que ele não precisa se autenticar novamente.

**Why this priority**: É a segunda parte do bug relatado — hoje a tela de login é exibida mesmo com uma sessão válida, permitindo o comportamento inconsistente onde o usuário "volta" para a home sem ter logado e vê o botão "Painel" incorretamente.

**Independent Test**: Fazer login, depois navegar manualmente para a URL de login e verificar o redirecionamento automático e imediato para o painel, sem exibir os campos de usuário/senha.

**Acceptance Scenarios**:

1. **Given** o usuário está autenticado (sessão válida) e acessa a URL de login sem parâmetro `redirectUrl`, **When** a página carrega, **Then** é redirecionado automaticamente para o painel, sem ver o formulário de login.
2. **Given** o usuário está autenticado (sessão válida) e acessa a URL de login com um `redirectUrl` interno válido (ex.: `/paineis/123`), **When** a página carrega, **Then** é redirecionado automaticamente para essa `redirectUrl`, sem ver o formulário de login.
3. **Given** o usuário está autenticado (sessão válida) e acessa a URL de login com um `redirectUrl` apontando para um domínio externo, **When** a página carrega, **Then** é redirecionado para o painel padrão (não para o domínio externo), sem ver o formulário de login.
4. **Given** o usuário não está autenticado, **When** ele acessa a URL da página de login, **Then** o formulário de login é exibido normalmente.

---

### Edge Cases

- O que acontece se a sessão expirar exatamente durante a navegação entre a página inicial e o painel (ex.: token expira entre o clique e o carregamento)? O sistema deve tratar isso como usuário não autenticado e enviá-lo ao login.
- O que acontece se a verificação da sessão ainda estiver em andamento (chamada assíncrona) no momento em que a página inicial ou a página de login é renderizada? O botão/redirecionamento não deve assumir um estado incorreto antes que a verificação seja concluída.
- O que acontece se o usuário tiver sessão válida no BFF, mas o perfil de aplicação ainda não tenha sido finalizado (fluxo de completar cadastro)? Deve seguir a mesma regra já aplicada pelos guards existentes (redirecionar para completar cadastro em vez do painel).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE verificar o estado de autenticação do usuário (sessão válida ou não) ao renderizar a página inicial.
- **FR-002**: Na página inicial, o sistema DEVE exibir o texto "Painel" no botão de acesso quando houver uma sessão válida, e "Entrar" quando não houver.
- **FR-003**: Na página inicial, o clique no botão DEVE navegar para o painel quando houver sessão válida, e para a tela de login quando não houver.
- **FR-004**: Ao acessar diretamente a rota de login com uma sessão válida já existente, o sistema DEVE redirecionar automaticamente o usuário: para a `redirectUrl` informada na query string, se presente e for uma URL interna válida da aplicação; caso contrário, para o painel padrão. Em nenhum caso o formulário de login deve ser exibido.
- **FR-004a**: O sistema NUNCA DEVE redirecionar para uma `redirectUrl` que aponte para um domínio ou origem externa à aplicação (proteção contra open redirect); nesse caso, DEVE usar o painel padrão como destino.
- **FR-005**: Ao acessar a rota de login sem sessão válida, o sistema DEVE exibir o formulário de login normalmente (comportamento atual permanece).
- **FR-006**: Enquanto o estado de autenticação ainda está sendo verificado na página inicial, o sistema DEVE exibir o botão com o texto "Entrar" como padrão, atualizando para "Painel" assim que a verificação confirmar uma sessão válida (o valor nunca deve regredir de "Painel" para "Entrar" após a confirmação, exceto se a sessão realmente não for válida).
- **FR-007**: O redirecionamento automático da tela de login para o painel, quando aplicável, DEVE respeitar as mesmas regras já existentes de verificação de cadastro completo (ou seja, se o usuário autenticado ainda não completou o cadastro na aplicação, deve ser enviado para a tela de completar cadastro em vez do painel).

### Key Entities

- **Sessão do usuário**: Representa se o usuário possui um token de autenticação válido no momento. É a informação central usada para decidir o texto do botão na página inicial e o comportamento de redirecionamento da tela de login.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% dos usuários com sessão válida que acessam a página inicial veem o botão com o texto "Painel", nunca "Entrar".
- **SC-002**: 100% dos usuários com sessão válida que acessam a URL de login são redirecionados ao painel (ou à tela de completar cadastro, se aplicável) sem precisar reinserir usuário e senha.
- **SC-003**: 0% dos usuários autenticados conseguem visualizar o formulário de login ao acessar diretamente a URL de login com sessão válida.
- **SC-004**: Usuários não autenticados continuam vendo o comportamento atual (botão "Entrar" na home, formulário de login exibido normalmente) sem nenhuma regressão.

## Assumptions

- "Estar logado" é equivalente a possuir uma sessão válida conforme já verificado pelo mecanismo de autenticação existente da aplicação (o mesmo usado pelos guards de rota atuais).
- A página inicial referida é uma página pública (não protegida por guard), distinta das rotas internas do painel.
- O comportamento de redirecionar usuários autenticados para fora da tela de login deve seguir a mesma lógica de checagem de cadastro completo já usada nas rotas protegidas, para não enviar ao painel um usuário que ainda não finalizou seu cadastro.
- Não há necessidade de alterar o mecanismo de autenticação em si (BFF/cookie de sessão) — o escopo é sobre a leitura desse estado para orientar a UI da home e o roteamento da tela de login.
