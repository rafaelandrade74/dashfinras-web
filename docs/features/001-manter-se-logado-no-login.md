# Manter-se logado no login

- **feature_id**: `ed6aa217-493b-4467-82a4-e2b896f49cb0`
- **project**: dashfinras-web (`dashfinras-web`)
- **slug**: `001-manter-se-logado-no-login`
- **status**: done
- **completed_at**: 2026-09-19T02:02:56.781Z
- **PR**: [#51](https://github.com/rafaelandrade74/dashfinras-web/pull/51)

## Specification

```json
{
  "overview": "Adicionar à tela de login a opção \"Manter-se logado\". Marcada, a sessão do usuário persiste entre fechamentos do navegador e só expira após 3 dias sem uso; desmarcada, o usuário permanece logado apenas enquanto o navegador estiver aberto e houver uso a cada 1 hora, e precisa entrar novamente ao reabrir o navegador. Hoje a sessão sempre persiste por 14 dias, independentemente da escolha, o que precisa ser corrigido.",
  "userScenarios": [
    "Usuário em computador pessoal marca \"Manter-se logado\", entra, fecha o navegador e ao reabrir no dia seguinte continua autenticado sem digitar credenciais.",
    "Usuário em computador compartilhado deixa a opção desmarcada, entra, fecha o navegador e ao reabrir precisa fazer login novamente.",
    "Usuário sem marcar a opção continua logado normalmente enquanto navega, recarrega a página ou abre novas abas com o navegador aberto e em uso.",
    "Usuário que marcou \"Manter-se logado\" e usa o sistema regularmente nunca precisa entrar de novo enquanto não passar 3 dias seguidos sem acessar.",
    "Usuário que não marcou a opção e deixou o navegador aberto por mais de 1 hora sem usar o sistema precisa entrar novamente ao voltar.",
    "Usuário que não marcou a opção deixa a aba aberta e parada por mais de 1 hora (sem clicar, navegar ou recarregar): ao voltar a interagir, o sistema reconhece a sessão expirada e leva ao login, mesmo sem recarregar a página."
  ],
  "acceptanceScenarios": [
    { "given": "a tela de login é exibida", "when": "o usuário a visualiza", "then": "existe a opção \"Manter-se logado\", desmarcada por padrão" },
    { "given": "o usuário fez login com \"Manter-se logado\" marcada", "when": "fecha completamente o navegador e o reabre dentro de 3 dias desde o último uso", "then": "acessa o sistema já autenticado" },
    { "given": "o usuário fez login com \"Manter-se logado\" desmarcada", "when": "fecha completamente o navegador e o reabre", "then": "é redirecionado para o login" },
    { "given": "o usuário fez login com \"Manter-se logado\" desmarcada", "when": "recarrega a página ou abre nova aba com o navegador ainda aberto e com uso na última hora", "then": "permanece autenticado" },
    { "given": "o usuário fez login com \"Manter-se logado\" desmarcada e deixou o navegador aberto por mais de 1 hora sem usar o sistema", "when": "tenta acessar o sistema", "then": "é redirecionado para o login" },
    { "given": "o usuário fez login com \"Manter-se logado\" desmarcada e usa o sistema pelo menos uma vez a cada hora", "when": "passa mais de 1 hora desde o login original com o navegador aberto", "then": "continua autenticado" },
    { "given": "o usuário fez login com \"Manter-se logado\" marcada e passou mais de 3 dias sem acessar o sistema", "when": "tenta acessar o sistema", "then": "é redirecionado para o login" },
    { "given": "o usuário fez login com \"Manter-se logado\" marcada e acessa o sistema pelo menos uma vez a cada 3 dias", "when": "passam mais de 3 dias desde o login original", "then": "continua autenticado" },
    { "given": "o usuário está logado em qualquer modo", "when": "faz logout", "then": "a sessão é encerrada e a escolha anterior deixa de valer" },
    { "given": "o usuário está com a aba aberta e sua sessão expirou por inatividade enquanto ele não interagia", "when": "ele volta a interagir com a página (clique, navegação ou nova ação)", "then": "é levado para o login, preservando para onde ele tentava ir" }
  ],
  "functionalRequirements": [
    { "id": "FR-001", "text": "A tela de login (modo entrar) deve exibir a opção \"Manter-se logado\", desmarcada por padrão." },
    { "id": "FR-002", "text": "Com a opção marcada, a sessão deve persistir após o fechamento e reabertura do navegador, e expirar somente após 3 dias sem uso; cada uso do sistema renova o prazo por mais 3 dias (prazo deslizante)." },
    { "id": "FR-003", "text": "Com a opção desmarcada, a sessão deve durar somente enquanto o navegador estiver aberto; ao fechá-lo e reabri-lo o usuário deve fazer login novamente." },
    { "id": "FR-004", "text": "Sem a opção marcada, a sessão deve continuar válida durante recarregamentos e novas abas com o navegador aberto, incluindo a renovação automática do acesso, sem pedir login enquanto houver uso a cada 1 hora." },
    { "id": "FR-005", "text": "A escolha do usuário deve ser preservada durante toda a vida da sessão, inclusive nas renovações automáticas de acesso e na renovação do prazo: uma sessão não persistente nunca deve virar persistente, e uma persistente continua persistente com prazo deslizante de 3 dias." },
    { "id": "FR-006", "text": "O comportamento atual (sessão sempre persistente por 14 dias, independente de escolha) deve ser substituído; sessões já existentes antes da mudança continuam válidas até seu prazo original." },
    { "id": "FR-007", "text": "O logout deve encerrar a sessão em ambos os modos." },
    { "id": "FR-008", "text": "O cadastro de nova conta com login automático posterior deve criar sessão não persistente (o usuário não teve chance de escolher a opção)." },
    { "id": "FR-009", "text": "Sem a opção marcada, a sessão deve expirar após 1 hora sem uso, mesmo com o navegador aberto; cada uso do sistema renova esse prazo por mais 1 hora (prazo deslizante)." },
    { "id": "FR-010", "text": "\"Uso do sistema\", para efeito dos prazos deslizantes (FR-002, FR-004, FR-009), é qualquer ação do usuário que gere uma chamada ao sistema em nome dele: navegar entre páginas, recarregar, ou interagir com uma tela que busca ou grava dados. Verificações automáticas em segundo plano sem ação do usuário (como a checagem periódica de sessão ao carregar uma página) não contam como uso para fins de renovação do prazo." },
    { "id": "FR-011", "text": "Quando a sessão expira por inatividade enquanto a aba está aberta e o usuário não estava interagindo, a próxima ação do usuário deve ser reconhecida como sessão expirada e o sistema deve levá-lo ao login, preservando a página que ele tentava acessar, em vez de exibir um erro genérico." }
  ],
  "successCriteria": [
    { "id": "SC-001", "text": "100% dos logins sem a opção marcada exigem novo login após fechar e reabrir o navegador.", "measurable": true },
    { "id": "SC-002", "text": "100% dos logins com a opção marcada permanecem autenticados após fechar e reabrir o navegador, desde que haja no máximo 3 dias entre dois usos consecutivos.", "measurable": true },
    { "id": "SC-003", "text": "Usuários que não marcam a opção e usam o sistema ao menos uma vez a cada hora não são deslogados inesperadamente durante uma sessão de navegador aberta.", "measurable": true },
    { "id": "SC-004", "text": "Usuário identifica e usa a opção no login sem instrução adicional, concluindo o login em menos de 30 segundos.", "measurable": true },
    { "id": "SC-005", "text": "100% das sessões sem a opção marcada deixadas sem uso por mais de 1 hora exigem novo login, mesmo com o navegador aberto.", "measurable": true },
    { "id": "SC-006", "text": "100% das sessões com a opção marcada deixadas sem uso por mais de 3 dias exigem novo login.", "measurable": true },
    { "id": "SC-007", "text": "100% das tentativas de interação após a sessão expirar com a aba aberta levam o usuário ao login, sem exibir mensagem de erro genérica no lugar do redirecionamento.", "measurable": true }
  ],
  "keyEntities": [
    {
      "name": "Sessão do usuário",
      "fields": [
        "persistente (sim/não)",
        "prazo de inatividade (3 dias se persistente, 1 hora se não persistente), renovado a cada uso",
        "instante do último uso"
      ],
      "relationships": [
        "pertence a um usuário autenticado",
        "criada no login, encerrada no logout ou expiração"
      ]
    }
  ],
  "edgeCases": [
    "Navegadores com \"restaurar abas ao reabrir\" podem manter a sessão não persistente viva após o fechamento, mas ela ainda expira após 1 hora sem uso; o restante é comportamento do navegador e é aceito.",
    "Usuário marca a opção e falha no login (senha errada): a escolha deve permanecer marcada na nova tentativa.",
    "Falha na renovação automática do acesso encerra a sessão em ambos os modos e leva ao login.",
    "Sessão persistente sem uso por mais de 3 dias, ou não persistente sem uso por mais de 1 hora, leva ao login preservando o redirecionamento para a página pretendida.",
    "Opção exibida apenas no modo entrar, não em cadastro nem recuperação de senha.",
    "Aba aberta e parada (sem interação) além do prazo: a expiração só é percebida na próxima ação do usuário, não em tempo real sem interação (ver FR-011)."
  ],
  "assumptions": [
    "O período de inatividade tolerado com a opção marcada é 3 dias, renovado a cada uso (reduzido dos 14 dias em uso hoje).",
    "O período de inatividade tolerado sem a opção marcada é 1 hora, renovado a cada uso.",
    "A opção vem desmarcada por padrão, por segurança.",
    "Sessão não persistente significa 'até o navegador ser fechado' ou 1 hora sem uso, o que ocorrer primeiro.",
    "O rótulo exibido em português será \"Manter-se logado\".",
    "Sem mudança no contrato com a API principal; a alteração fica restrita ao fluxo de autenticação deste app.",
    "Sessões já emitidas antes da entrega não são invalidadas e seguem seu prazo original de até 14 dias.",
    "O app não possui chamadas periódicas em segundo plano à API (verificado: o único setInterval do front troca dicas de UI, sem rede), então 'uso' pode ser definido como ação do usuário sem risco de uma aba esquecida renovar o prazo sozinha."
  ]
}
```

## Plan

```json
{
  "technicalContext": {
    "language": "TypeScript (Angular NgModules, zoneless, sem standalone) + Node/Express (BFF em src/server)",
    "storage": "Somente o cookie selado df_session; nenhum banco novo",
    "testing": "vitest: src/server/auth.spec.ts (com dublês do Supabase), login.spec.ts / auth.service.spec.ts, e novo auth-expired.interceptor.spec.ts",
    "dependencies": [
      "iron-session 8.0.4 (cookie df_session selado)",
      "@supabase/supabase-js (auth server-side)",
      "Angular Reactive Forms + HttpClient functional interceptors (provideHttpClient(withInterceptors([...])) em app-module.ts)",
      "vitest (ng test)"
    ],
    "currentState": "session.ts fixa ttl=14d para todo login; cookie com maxAge=ttl-60s (persistente). auth.ts /login e /signup gravam accessToken/refreshToken/expiresAt e save(). getValidSession só regrava o cookie quando renova o token (a cada ~1h), não a cada uso. AuthService.login(email, password) não envia nenhuma escolha. loginForm tem só email e senha. app-module.ts registra só loadingInterceptor. authGuard já sabe redirecionar para /login?redirectUrl=... na navegação de rota, mas nada trata um 401 vindo de uma chamada HTTP feita com a aba já aberta.",
    "targetState": "Sessão com dois perfis: persistente (marcado) = cookie com maxAge 3 dias renovado a cada uso; não persistente = cookie de sessão (sem maxAge) + expiração por inatividade de 1 hora, aplicada no servidor, renovada a cada uso. Além disso, qualquer chamada a /api/* que volte 401 not_authenticated (sessão expirada com a aba aberta, FR-011) limpa o estado local de autenticação e redireciona para /login?redirectUrl=<url atual>, sem expor erro genérico ao usuário (SC-007).",
    "constraints": [
      "App zoneless: estado em then()/subscribe() deve ser signal (checkbox usa FormControl; o interceptor não introduz estado de componente)",
      "Não tocar em environment.ts nem environment.prod.ts",
      "Sem mudança no contrato com api-dashfinras; não reintroduzir account/login|logout",
      "GET /api/auth/session é o próprio polling de boot (AuthService.waitUntilReady) e não deve entrar em loop de redirecionamento consigo mesmo"
    ]
  },
  "constitutionCheck": [
    { "principle": "Nenhuma constituição definida para o projeto na época", "status": "n/a" },
    { "principle": "CLAUDE.md: NgModules, sem standalone", "status": "complies - novo interceptor é uma função registrada em app-module.ts, mesmo padrão de loadingInterceptor" },
    { "principle": "CLAUDE.md: BFF é o único a falar com o Supabase; cookie httpOnly same-origin", "status": "complies - interceptor só reage a 401 que o BFF já emite" },
    { "principle": "CLAUDE.md: não reintroduzir account/login|logout na API", "status": "complies" },
    { "principle": "CLAUDE.md: strings de UI e commits em português", "status": "complies" },
    { "principle": "Pós-design: interceptor não interfere no fluxo de login/logout", "status": "complies - ignora /api/auth/login, /signup, /reset-password, /logout e /session" }
  ],
  "research": [
    {
      "decision": "Não persistente = cookie de sessão via cookieOptions.maxAge: undefined",
      "rationale": "No iron-session 8.0.4 (getSessionConfig), maxAge presente e undefined zera ttl e o cookie vira de sessão do navegador (some ao fechar).",
      "alternatives": ["maxAge curto de 1h: sobreviveria ao fechar o navegador por até 1h, violando FR-003"]
    },
    {
      "decision": "Expiração por inatividade aplicada no servidor com campo lastActivityAt dentro da sessão selada",
      "rationale": "Com maxAge undefined o ttl do selo vira 0 (sem expiração) e um cookie de sessão pode ser restaurado pelo navegador. O servidor compara Date.now() com lastActivityAt e destrói a sessão se passou de 1h (FR-009, SC-005). O mesmo campo serve como segunda barreira (3 dias) no modo persistente.",
      "alternatives": ["Confiar só no maxAge do cookie", "Guardar a inatividade no Supabase: nova chamada de rede por requisição"]
    },
    {
      "decision": "Guardar persistente: boolean dentro da sessão e reaplicar com session.updateConfig() a cada save",
      "rationale": "Garante que a renovação de token (getValidSession) nunca promova uma sessão não persistente a persistente (FR-005).",
      "alternatives": ["Dois cookies com nomes diferentes: duplica leitura, logout e proxy"]
    },
    {
      "decision": "Renovação deslizante: regravar o cookie em cada requisição autenticada (GET /api/auth/session e proxy /api/*), com limitação de 60s entre gravações",
      "rationale": "Para deslizar 1h/3d é preciso atualizar lastActivityAt e reemitir Set-Cookie. A limitação de 60s evita um Set-Cookie por requisição e reduz corridas entre abas.",
      "alternatives": ["Regravar a cada requisição sem limite", "Só renovar em /api/auth/session"]
    },
    {
      "decision": "Sessões legadas (sem campo persistente) mantêm o comportamento atual até o prazo original",
      "rationale": "FR-006: não invalidar sessões emitidas. Quando persistente é undefined, getValidSession ignora a regra de inatividade. Esse ramo pode ser removido 14 dias após o deploy.",
      "alternatives": ["Tratar legado como não persistente: desloga todo mundo no deploy", "Migrar legado para persistente de 3 dias: muda o prazo sem consentimento"]
    },
    {
      "decision": "Cadastro com login automático usa sessão não persistente (FR-008)",
      "rationale": "/api/auth/signup não recebe a escolha; o usuário não viu o checkbox.",
      "alternatives": ["Enviar a escolha também no signup: fora de escopo"]
    },
    {
      "decision": "Checkbox do login como FormControl reativo (manterLogado, padrão false), sem signal novo",
      "rationale": "O valor é lido no submit, não atualizado em then()/subscribe(). O formulário não é resetado em erro, então a marcação permanece.",
      "alternatives": ["Signal separado: redundante com o formulário"]
    },
    {
      "decision": "Constantes de prazo em session.ts: PERSISTENT_TTL_SECONDS=3 dias, IDLE_TTL_SECONDS=1 hora",
      "rationale": "Substitui SESSION_TTL_SECONDS (14 dias); um lugar só para os valores da spec.",
      "alternatives": ["Variáveis de ambiente: sem necessidade hoje"]
    },
    {
      "decision": "FR-010/FR-011: criar authExpiredInterceptor registrado em app-module.ts junto de loadingInterceptor",
      "rationale": "Intercepta 401 { code: 'not_authenticated' } de /api/* (exceto /api/auth/login|signup|reset-password|logout|session), chama AuthService.limparSessaoLocal() e redireciona para /login?redirectUrl=<url atual>. Usa o 401 que o proxy já emite, sem polling, e reaproveita o padrão redirectUrl do authGuard.",
      "alternatives": ["Interceptor sem lista de exclusão", "Tratar no authGuard: não cobre chamada de API em tela já carregada", "Polling de /api/auth/session: mais rede e mais um timer, e a spec só exige reconhecer na próxima ação (FR-011)"]
    },
    {
      "decision": "AuthService ganha limparSessaoLocal() para zerar sessionSubject sem round-trip ao servidor",
      "rationale": "O servidor já expirou a sessão (por isso respondeu 401); chamar POST /api/auth/logout de novo seria redundante.",
      "alternatives": ["Chamar authService.logout(): HTTP extra desnecessário a cada expiração"]
    }
  ],
  "dataModel": [
    {
      "entity": "SessionData (cookie df_session selado)",
      "fields": [
        "accessToken?: string",
        "refreshToken?: string",
        "expiresAt?: number (exp do JWT)",
        "persistente?: boolean (novo; undefined = sessão legada)",
        "lastActivityAt?: number (novo; epoch em segundos do último uso)"
      ],
      "relationships": ["1 sessão por navegador, ligada ao usuário do Supabase pelo par de tokens"],
      "validationRules": [
        "persistente=true: expira quando agora - lastActivityAt > 3 dias",
        "persistente=false: expira quando agora - lastActivityAt > 1 hora",
        "persistente undefined (legado): nenhuma regra nova, vale só o selo original de 14 dias",
        "cookie serializado deve ficar abaixo de 4096 bytes"
      ],
      "stateTransitions": [
        "login(manterLogado) -> ativa (persistente=manterLogado, lastActivityAt=agora)",
        "uso autenticado -> ativa (lastActivityAt renovado, no máximo a cada 60s)",
        "inativa além do limite -> destruída (cookie removido, resposta não autenticada/401)",
        "refresh do token falha -> destruída",
        "logout -> destruída",
        "persistente nunca muda de valor após o login"
      ]
    }
  ],
  "contracts": [
    "POST /api/auth/login  body: { email, password, manterLogado?: boolean }  (ausente ou não booleano true = false). 200 { ok: true } com Set-Cookie df_session; persistente => Max-Age=259200 (3 dias) - 60s de skew do iron-session; não persistente => sem Max-Age/Expires. 401 { code } e 400 { code: invalid_request } inalterados.",
    "POST /api/auth/signup  sem mudança de contrato; quando retorna sessão, ela é gravada com persistente=false",
    "GET /api/auth/session  sem mudança no corpo; retorna { authenticated: false } e remove o cookie quando a inatividade estourou (nunca 401); renova lastActivityAt (limitado a 60s) quando autenticado",
    "ANY /api/*  (proxy)  401 { code: 'not_authenticated' } também quando a sessão estourou a inatividade; renova o cookie antes de encaminhar quando válida",
    "AuthService.login(email, password, manterLogado = false): Promise<AuthResult>  envia { email, password, manterLogado }",
    "AuthService.limparSessaoLocal(): void  zera o estado local de autenticação sem chamar a API (usado por logout() e pelo interceptor)",
    "authExpiredInterceptor: HttpInterceptorFn registrado em provideHttpClient(withInterceptors([loadingInterceptor, authExpiredInterceptor])); em 401 { code: 'not_authenticated' } fora da lista /api/auth/*, chama limparSessaoLocal() e router.navigateByUrl('/login?redirectUrl=' + encodeURIComponent(router.url))",
    "UI: loginForm ganha controle manterLogado (checkbox, padrão false), rótulo 'Manter-se logado', visível só em modo login, abaixo da senha e acima do botão Entrar"
  ],
  "quickstart": [
    "Pré-requisitos: cp .env.example .env preenchido; environment.ts já existente (não alterar); npm run start:dev.",
    "Testes automatizados: npm test (auth.spec.ts, login.spec.ts, auth.service.spec.ts e auth-expired.interceptor.spec.ts).",
    "Manual 1 (SC-002/FR-002): logar com o checkbox marcado; cookie df_session com Expires ~3 dias; fechar e reabrir o navegador continua logado.",
    "Manual 2 (SC-001/FR-003): logar sem marcar; cookie com Expires = Session; fechar todo o navegador e reabrir cai em /login.",
    "Manual 3 (FR-009/SC-005): reduzir temporariamente IDLE_TTL_SECONDS para 60s em dev, logar sem marcar, aguardar 70s sem uso e recarregar: volta ao login; usando a cada 30s: continua logado. Reverter o valor depois.",
    "Manual 4 (FR-005): sessão não persistente atravessando a renovação do access_token continua com cookie de sessão (sem Expires).",
    "Manual 5 (FR-006): cookie emitido antes da mudança (sem o campo persistente) continua funcionando.",
    "Manual 6 (FR-011/SC-007): com IDLE_TTL_SECONDS reduzido, deixar a aba parada além do prazo e clicar em uma ação que chame a API: redireciona a /login?redirectUrl=... sem erro genérico na tela."
  ]
}
```

## Tasks

- [x] **T001** [Setup] Criar branch feature/manter-se-logado a partir do develop atualizado e rodar npm test como baseline
- [x] **T002** [Foundational] Refatorar src/server/session.ts: novos campos de SessionData, constantes de prazo e helpers de sessão
- [x] **T003** [US1] Aceitar manterLogado em POST /api/auth/login e gravar persistente/lastActivityAt em src/server/auth.ts
- [x] **T004** [US1, P] AuthService.login enviar manterLogado em src/app/core/services/auth.service.ts
- [x] **T005** [US1] Adicionar controle manterLogado ao loginForm e repassá-lo em entrar() em src/app/features/auth/login/login.ts
- [x] **T006** [US1] Exibir checkbox 'Manter-se logado' no modo login em login.html e login.scss
- [x] **T007** [US1, P] Testes servidor US1 em src/server/auth.spec.ts: login com manterLogado=true e false
- [x] **T008** [US1, P] Testes cliente US1 em auth.service.spec.ts e login.spec.ts: checkbox e payload
- [x] **T009** [US2] getValidSession aplicar inatividade e renovação deslizante e preservar persistente em src/server/session.ts
- [x] **T010** [US2, P] Cadastro com login automático criar sessão não persistente em src/server/auth.ts (/signup)
- [x] **T011** [US2] Verificar que api-proxy.ts não sobrescreve o Set-Cookie renovado e ajustar se necessário
- [x] **T012** [US2] Testes servidor US2 em src/server/auth.spec.ts: expiração por 1h, renovação deslizante, refresh e signup
- [x] **T013** [US3] Testes servidor US3 em src/server/auth.spec.ts: sessão persistente de 3 dias deslizante
- [x] **T014** [US3] Garantir e testar compatibilidade com sessões legadas (sem campo persistente) em session.ts e auth.spec.ts
- [ ] ~~**T015**~~ [Polish] _(skipped — substituída pela T023)_ Atualizar CLAUDE.md e docs/padroes-frontend.md com o novo comportamento de sessão
- [ ] ~~**T016**~~ [Polish] _(skipped — substituída pela T024)_ Rodar npm test e npm run build e corrigir regressões
- [ ] ~~**T017**~~ [Polish] _(skipped — substituída pela T025)_ Validação manual conforme quickstart do plano v1
- [x] **T018** [US4, P] Extrair AuthService.limparSessaoLocal() em src/app/core/services/auth.service.ts
- [x] **T019** [US4] Criar authExpiredInterceptor em src/app/core/interceptors/auth-expired.interceptor.ts
- [x] **T020** [US4] Registrar authExpiredInterceptor em src/app/app-module.ts
- [x] **T021** [US4, P] Testes do interceptor em src/app/core/interceptors/auth-expired.interceptor.spec.ts
- [x] **T022** [US2] Ajustar dependência entre testes: T012 depende de T007 (mesmo arquivo auth.spec.ts) _(registro)_
- [x] **T023** [Polish, P] Atualizar CLAUDE.md (seção Auth wiring) e docs/padroes-frontend.md com o novo comportamento de sessão e o interceptor
- [x] **T024** [Polish] Rodar npm test e npm run build e corrigir regressões
- [x] **T025** [Polish] Validação manual conforme quickstart do plano v2 com npm run start:dev _(feita pelo usuário; resultados por cenário não registrados)_
- [x] **T026** [Setup] [Registro] T015, T016 e T017 estão obsoletas — usar T023, T024 e T025
- [x] **T027** [US2] [Registro] T022 concluída sem ação — dependência T012<-T007 já existia

## Analysis

```json
[
  {
    "area": "Duplication",
    "severity": "high",
    "description": "T015/T016/T017 (plano v1, Polish) não foram removidas quando T023/T024/T025 (plano v2) foram criadas para substituí-las, pois generate_tasks não permite editar/excluir tarefas existentes. As duas trincas tocam os mesmos arquivos, mas T015–T017 não mencionam o authExpiredInterceptor nem FR-010/FR-011/SC-007. Resolvido: T015–T017 marcadas como skipped e T026 registra a substituição.",
    "relatedTaskCodes": ["T015", "T016", "T017", "T023", "T024", "T025"]
  },
  {
    "area": "Inconsistency",
    "severity": "medium",
    "description": "T022 foi criada para registrar o achado F1, mas T012 já tinha dependsOn incluindo T007. T022 é redundante e seu título sugere incorretamente que a dependência ainda não existe. Resolvido pela T027.",
    "relatedTaskCodes": ["T022", "T007", "T012"]
  },
  {
    "area": "Coverage Gaps",
    "severity": "low",
    "description": "SC-004 (usuário identifica a opção sem instrução, login em menos de 30s) continua sem tarefa/teste próprio; é métrica de usabilidade pós-entrega. T025 pede para registrar essa observação manualmente.",
    "relatedTaskCodes": ["T025"]
  },
  {
    "area": "Underspecification",
    "severity": "low",
    "description": "FR-006 mantém sessões legadas por até 14 dias após o deploy, sem tarefa nem critério formal para remover o ramo de compatibilidade depois desse prazo. T014 comenta a intenção no código, mas não há tarefa de acompanhamento agendada.",
    "relatedTaskCodes": ["T014"]
  },
  {
    "area": "Coverage Gaps",
    "severity": "low",
    "description": "FR-007 (logout encerra a sessão em ambos os modos) segue coberto por um único caso em T013(d); nenhuma tarefa testa que api-proxy.ts também nega acesso imediatamente após logout numa mesma aba com chamada em andamento.",
    "relatedTaskCodes": ["T013"]
  }
]
```
