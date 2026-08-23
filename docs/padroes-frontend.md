# Padrões do frontend (dashfinras-web)

Este documento reúne padrões de implementação recorrentes na aplicação — coisas que não são
óbvias lendo um componente isolado, mas que se aplicam em toda a base. Ver também [CLAUDE.md](../CLAUDE.md)
para a visão geral de arquitetura.

## 1. App roda sem zone.js (zoneless) — use signals para estado atualizado fora do Angular

`zone.js` **não está instalado** neste projeto (não consta em `package.json`, não há polyfill
configurado em `angular.json`). O Angular roda em modo zoneless.

### O que isso muda na prática

Em modo zoneless, o Angular só sabe que precisa re-renderizar quando algo passa por uma API que
ele instrumenta (bindings de template, `async` pipe, Router, Forms, HttpClient com `async` pipe,
signals). Se você atualiza uma propriedade comum de classe (`this.algo = valor`) dentro de um
callback de **Promise** (`.then()`) ou de um `.subscribe()` de Observable feito manualmente, o
Angular não é notificado — a view só volta a refletir o novo estado no próximo evento de UI que
*por acaso* dispare um ciclo de detecção de mudanças em outro lugar da árvore.

Sintoma típico: um spinner de loading (`carregando = true` / `false`) que fica preso na tela
mesmo depois da resposta já ter chegado — porque `carregando = false` foi setado, só que ninguém
avisou o Angular para re-renderizar. Isso já aconteceu (e foi corrigido) em três lugares:

- [`Login`](../src/app/features/auth/login/login.ts) — login, cadastro e recuperação de senha
- [`PainelList.sair()`](../src/app/features/painel/painel-list/painel-list.ts) — logout sem redirecionar
- [`CompletarCadastro`](../src/app/features/cadastro/completar-cadastro/completar-cadastro.ts) — salvar perfil

### A regra

**Qualquer estado de componente que é atualizado dentro de um `.then()`/`.catch()`/`.finally()`
de Promise, ou dentro de um `.subscribe()` de Observable, deve ser um `signal()`, não um campo
comum de classe.** Signals notificam o scheduler do Angular corretamente, independente de zone.js.

```ts
// ❌ Não faz a view atualizar de forma confiável em modo zoneless
export class Exemplo {
  carregando = false;

  buscar(): void {
    this.carregando = true;
    this.service.buscar().subscribe({
      next: () => { this.carregando = false; },
      error: () => { this.carregando = false; }
    });
  }
}
```

```ts
// ✅ Correto
export class Exemplo {
  readonly carregando = signal(false);

  buscar(): void {
    this.carregando.set(true);
    this.service.buscar().subscribe({
      next: () => { this.carregando.set(false); },
      error: () => { this.carregando.set(false); }
    });
  }
}
```

No template, chame o signal como função: `[disabled]="carregando()"`, `@if (carregando()) { ... }`.

### Exceções — quando NÃO precisa de signal

- Dados só lidos no template via `async` pipe (`observable$ | async`) — o `async` pipe já notifica
  o Angular sozinho. É por isso que o loading overlay global (`LoadingService.isLoading$` em
  [`app.html`](../src/app/app.html)) funciona sem signals.
- Valores computados a partir de um `FormGroup`/`FormControl` que são lidos diretamente do próprio
  form no template (`form.controls['x'].invalid`) — o Forms module já notifica o Angular nas
  interações do próprio formulário (digitação, submit). Só vira problema quando você deriva um
  **novo** estado componente a partir de um valueChanges e precisa que ele atualize a UI fora do
  ciclo normal de interação do form — nesse caso, use `toSignal()` (ver seção 3).
- Coisas que só são lidas de novo quando o Angular já vai re-renderizar por outro motivo de
  qualquer forma (raro; prefira sempre pecar pelo lado do signal quando há dúvida).

## 2. AuthService / Supabase Auth

[`AuthService`](../src/app/core/services/auth.service.ts) encapsula toda a superfície do Supabase
Auth usada pela aplicação. Os métodos assíncronos (`login`, `signUp`, `resetPassword`) **nunca
rejeitam a Promise** — qualquer exceção (rede, DNS, etc.) é capturada internamente e convertida em
`{ error: mensagem amigável }`. Isso é proposital: um chamador que só trata `.then()` sem
`.catch()` não deve deixar a UI travada em estado de carregamento por causa de uma falha de rede
não tratada (bug já corrigido — ver commit `fix(auth): trata falhas de rede...`). Mesmo assim, os
componentes que chamam esses métodos mantêm um `.catch()`/`.finally()` como rede de segurança
extra.

### Contrato de retorno (`AuthResult`)

```ts
interface AuthResult {
  error?: string;                  // mensagem já traduzida para o usuário, pronta para exibir
  precisaConfirmarEmail?: boolean; // signUp bem-sucedido, mas aguardando confirmação de e-mail
}
```

### `signUp` — três desfechos possíveis

Depende da configuração de confirmação de e-mail do projeto Supabase (Authentication → Settings):

1. **Sessão criada** (`{}`) — confirmação de e-mail desligada no projeto, ou já confirmado por
   outro meio. Login automático, componente segue direto para `/completar-cadastro`.
2. **E-mail já cadastrado** (`{ error: '...' }`) — o Supabase, por proteção anti-enumeração, não
   retorna um erro explícito nesse caso: devolve 200 com um usuário sem `identities`. O
   `AuthService` detecta esse padrão e traduz para uma mensagem de erro normal.
3. **Confirmação pendente** (`{ precisaConfirmarEmail: true }`) — confirmação de e-mail ligada no
   projeto (padrão em projetos novos). O componente `Login` mostra a tela `signup-sent` orientando
   o usuário a checar o e-mail antes de tentar entrar.

Ao mexer em fluxo de cadastro, sempre tratar os três casos — é fácil esquecer o caso 3 e assumir
que "sucesso = tem sessão".

## 3. Indicador de força de senha (`toSignal` + `computed`)

[`password-complexity.validator.ts`](../src/app/core/validators/password-complexity.validator.ts)
exporta tanto o `ValidatorFn` usado no form quanto `avaliarCriteriosSenha()`, uma função pura que
recebe uma string e devolve quais critérios (tamanho, maiúscula, minúscula, número, especial) ela
atende. As duas coisas são derivadas dos mesmos regex para não haver divergência entre o que o
form valida e o que a UI mostra como atendido.

O componente [`Login`](../src/app/features/auth/login/login.ts) usa esse padrão para expor o
indicador de força em tempo real:

```ts
const senhaValor = toSignal(this.signupForm.controls['senha'].valueChanges, { initialValue: '' });
this.senhaCriterios = computed(() => avaliarCriteriosSenha(senhaValor() ?? ''));
```

`toSignal()` (de `@angular/core/rxjs-interop`) é a ponte correta entre um `Observable` de
`valueChanges` e o grafo de signals — é assim que se deriva estado reativo de um form sem cair no
mesmo problema da seção 1 (usar um campo comum atualizado num `.subscribe()` manual).

## 4. Convenção visual de erro/sucesso de formulário

Toda tela de formulário (login, cadastro, completar-cadastro) usa a mesma estrutura de banner para
mensagens vindas da API, com as classes `.api-error` / `.api-success` definidas localmente em cada
`*.scss` (design system "paper/ink" — tokens documentados no próprio SCSS de cada componente):

```html
@if (mensagemErro()) {
  <div class="api-error" role="alert">
    <i class="ti ti-alert-triangle" aria-hidden="true"></i>
    <span>{{ mensagemErro() }}</span>
  </div>
}
```

Ao adicionar uma nova tela de formulário, reaproveitar essa estrutura em vez de criar um padrão
visual novo de erro.

## 5. Environments com credenciais reais fora do git

`src/environments/environment.ts` e `environment.prod.ts` são **gitignored** — só
`environment.example.ts` / `environment.prod.example.ts` (com placeholders) ficam versionados. Ver
seção "Environments" do [CLAUDE.md](../CLAUDE.md) para o motivo e o passo a passo de setup local.
