# Feature Specification: Atualizar Status de Convite para Novo Formato da API

**Feature Branch**: `005-atualizar-status-convite`

**Created**: 2026-08-26

**Status**: Draft

**Input**: User description: "temos uma mudança na api agora ela só tem 4 status para convite, precisa ser ajustado para o novo formato

public enum StatusConviteExibicao
{
    Pendente,
    Aprovado,
    Recusado,
    Expirado
}"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Visualizar status correto do convite no histórico (Priority: P1)

Como administrador de um painel, ao abrir a tela de detalhes do painel e consultar o histórico de
convites enviados, quero ver o status de cada convite refletindo exatamente os 4 estados que a API
agora retorna (Pendente, Aprovado, Recusado, Expirado), para não ser induzido a erro por rótulos ou
estados que não existem mais.

**Why this priority**: É o único ponto da aplicação que lê e exibe o status do convite; sem este
ajuste a tela quebra (valores desconhecidos) ou exibe informação incorreta assim que a API mudar.

**Independent Test**: Pode ser testado abrindo o histórico de convites de um painel com convites em
cada um dos 4 estados e conferindo que cada linha mostra o rótulo e estilo visual correspondentes.

**Acceptance Scenarios**:

1. **Given** um convite retornado pela API com status "Pendente", **When** o histórico de convites é
   exibido, **Then** a linha mostra o rótulo "Pendente" com o estilo visual de pendente.
2. **Given** um convite retornado pela API com status "Aprovado", **When** o histórico de convites é
   exibido, **Then** a linha mostra o rótulo "Aprovado" com o estilo visual de sucesso.
3. **Given** um convite retornado pela API com status "Recusado", **When** o histórico de convites é
   exibido, **Then** a linha mostra o rótulo "Recusado" com o estilo visual de recusado.
4. **Given** um convite retornado pela API com status "Expirado", **When** o histórico de convites é
   exibido, **Then** a linha mostra o rótulo "Expirado" com o estilo visual de expirado.

---

### User Story 2 - Reenviar convite continua disponível nos estados corretos (Priority: P2)

Como administrador de um painel, quero poder reenviar um convite quando ele estiver Recusado ou
Expirado, para não precisar cadastrar um novo convite manualmente quando o original não seguiu
adiante.

**Why this priority**: É uma ação dependente do status do convite; se a lista de estados que
permitem reenvio não for atualizada junto com o novo formato, a ação de reenviar pode desaparecer
indevidamente ou continuar checando um estado que não existe mais na API.

**Independent Test**: Pode ser testado abrindo o histórico de convites com um convite Recusado e um
Expirado e confirmando que a opção de reenviar aparece para ambos, e não aparece para convites
Pendente ou Aprovado.

**Acceptance Scenarios**:

1. **Given** um convite com status "Recusado", **When** o histórico de convites é exibido, **Then**
   a opção de reenviar convite fica disponível para esse convite.
2. **Given** um convite com status "Expirado", **When** o histórico de convites é exibido, **Then**
   a opção de reenviar convite fica disponível para esse convite.
3. **Given** um convite com status "Pendente" ou "Aprovado", **When** o histórico de convites é
   exibido, **Then** a opção de reenviar convite não fica disponível para esse convite.

---

### Edge Cases

- O que acontece se a API retornar um valor de status fora dos 4 esperados (ex.: um estado antigo
  ainda em cache ou um valor futuro ainda não mapeado na tela)? A tela não deve quebrar; deve exibir
  um estado neutro reconhecível em vez de travar a listagem inteira.
- Convites que hoje estão em "Pendente Cadastro" ou "Pendente Aprovação" (dois estados antigos que
  colapsam em "Pendente" no novo formato) devem continuar sendo exibidos como pendentes sem
  distinção visual entre os dois motivos.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE reconhecer exatamente os 4 status de convite retornados pela API:
  Pendente, Aprovado, Recusado e Expirado.
- **FR-002**: O sistema DEVE exibir, para cada convite no histórico, um rótulo em português e um
  estilo visual distinto correspondente ao seu status atual entre os 4 acima.
- **FR-003**: O sistema DEVE remover o tratamento de estados de convite que não existem mais no
  novo formato da API (o antigo estado "Invalidado" e a distinção entre "Pendente Cadastro" e
  "Pendente Aprovação").
- **FR-004**: O sistema DEVE permitir a ação de reenviar convite apenas quando o status do convite
  for Recusado ou Expirado.
- **FR-005**: O sistema NÃO DEVE permitir a ação de reenviar convite quando o status for Pendente
  ou Aprovado.
- **FR-006**: O sistema DEVE continuar exibindo o histórico de convites sem erros mesmo que um
  convite individual venha com um status não reconhecido, tratando-o com um rótulo neutro em vez de
  interromper a exibição da lista inteira.

### Key Entities

- **Convite**: Representa um convite de acesso a um painel, com um status que agora assume um dos 4
  valores do novo formato da API (Pendente, Aprovado, Recusado, Expirado), usado para decidir o
  rótulo exibido e se a ação de reenvio está disponível.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% dos convites listados no histórico exibem um rótulo de status correspondente a
  um dos 4 estados do novo formato da API, sem rótulos ou estilos obsoletos.
- **SC-002**: A ação de reenviar convite aparece corretamente em 100% dos convites Recusados e
  Expirados, e não aparece em nenhum convite Pendente ou Aprovado.
- **SC-003**: A tela de histórico de convites não apresenta erros de exibição (linha quebrada,
  travamento da lista) mesmo diante de um status de convite não mapeado.

## Assumptions

- A API já foi ou será atualizada de forma coordenada para retornar apenas os 4 valores de
  `StatusConviteExibicao` informados (Pendente, Aprovado, Recusado, Expirado); este trabalho cobre
  apenas o ajuste do lado da aplicação para consumir o novo formato.
- Os dois antigos estados de pendência ("Pendente Cadastro" e "Pendente Aprovação") são
  representados pela API como um único "Pendente" no novo formato; não há necessidade de distinguir
  visualmente os dois motivos na tela.
- O antigo rótulo "Aceito" (usado para o estado "Concluído") passa a ser "Aprovado", acompanhando o
  nome do novo status da API.
- O antigo estado "Invalidado" não tem equivalente direto no novo formato e deixa de existir na
  aplicação.
