# Phase 1 Data Model: CTA da página inicial reflete sessão ativa

Esta feature não introduz nem altera entidades de domínio/persistência. O único "estado" relevante é de UI/sessão em memória do navegador.

## Estado de UI: Sessão do usuário (client-side)

Não é uma entidade de dados persistida — é o estado já mantido por `AuthService` (`core/services/auth.service.ts`), consumido de forma nova pelos componentes desta feature.

| Campo | Tipo | Descrição |
|---|---|---|
| `isAuthenticated` | `boolean` (getter existente) | Sessão válida (`df_session` decodificado com sucesso) no momento da leitura. Não muda de forma nova nesta feature. |
| `waitUntilReady()` | `Promise<void>` (método existente) | Resolve quando o fetch de sessão do boot (`GET /api/auth/session`) termina (sucesso ou falha). Ponto de sincronização usado pelos dois componentes novos. |
| `sessaoConfirmada` (novo, local a `LandingComponent`) | `signal<boolean>` | Reflete `isAuthenticated` **depois** de `waitUntilReady()` resolver; inicia em `false` (equivalente a "Entrar" por padrão, conforme clarificação de loading). |
| `checandoSessao` (novo, local a `LoginComponent`) | `signal<boolean>` | `true` enquanto `waitUntilReady()` está pendente; usado para não piscar o formulário de login antes do redirecionamento automático (quando aplicável). |

## Helper: validação de URL interna

| Função | Assinatura | Regra |
|---|---|---|
| `isInternalRedirectUrl` | `(url: string \| null \| undefined) => boolean` | Retorna `true` somente se `url` começar com exatamente uma `/` e não com `//` ou `/\` (evita URLs protocol-relative) e não contiver `:` antes da primeira `/` (evita esquemas embutidos tipo `javascript:`, `https:`). Usada para decidir entre `redirectUrl` da query string e o destino padrão `/paineis`. |

Não há transições de estado persistidas, relações entre entidades, nem volume/escala a considerar — o escopo é inteiramente de leitura de um estado de sessão já existente e sua propagação reativa correta na UI.
