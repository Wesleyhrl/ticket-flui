# Ticket Flui

Sistema de controle de chamados internos desenvolvido para o desafio tecnico FullStack da Codificar. A aplicacao centraliza pedidos internos, permite acompanhar a fila de atendimento e ajuda a distribuir chamados entre responsaveis de suporte.

## Escopo do desafio

O objetivo e entregar uma primeira versao de uma aplicacao web executavel localmente, com:

- cadastro, edicao, listagem e acompanhamento de chamados;
- responsavel claro para cada atendimento;
- selecao manual de responsavel;
- distribuicao automatica para o responsavel com menor carga;
- interface organizada para uso diario;
- documentacao de instalacao, execucao e decisoes relevantes.

## Tecnologias

- Next.js 16 com App Router
- React 19
- TypeScript
- Prisma 7
- SQLite
- Tailwind CSS 4
- shadcn/ui
- lucide-react
- JWT com cookie HTTP-only
- Jest

## Decisoes tecnicas

- **Next.js full stack**: concentra frontend e backend no mesmo projeto, reduzindo atrito entre telas, APIs e regras de negocio.
- **App Router + Route Handlers**: organiza telas em `app/` e endpoints em `app/api/`, seguindo a estrutura atual do Next.js 16.
- **Prisma + SQLite**: simplifica a execucao local e mantem o modelo de dados tipado e versionado por migrations.
- **Services**: regras como validacao de chamado e distribuicao automatica ficam em `services/`, separadas das rotas HTTP.
- **shadcn/ui + Tailwind CSS**: permitem montar uma interface funcional e consistente sem criar um design system do zero.
- **JWT em cookie HTTP-only**: evita expor o token no JavaScript do navegador e facilita protecao via proxy.

## Funcionalidades

- Login e logout com sessao em cookie seguro.
- Listagem de chamados com filtros por status e prioridade.
- Busca textual na fila de chamados.
- Cadastro de chamados por usuario `ADMIN`.
- Atribuicao manual de responsavel ou distribuicao automatica para o suporte com menor carga aberta.
- Edicao de titulo, descricao, prioridade, solicitante e responsavel por usuario `ADMIN`.
- Exclusao de chamados por usuario `ADMIN`.
- Alteracao de status com controle por perfil.
- Registro automatico de data de solucao ao marcar chamado como `RESOLVIDO`.

## Distribuicao automatica

Quando o administrador cria um chamado sem escolher responsavel, o sistema seleciona automaticamente o usuario `SUPORTE` com menor quantidade de chamados ainda nao concluidos.

Neste projeto, chamados "em aberto" para calculo de carga sao os status:

- `ABERTO`
- `EM_ANDAMENTO`

Os status `RESOLVIDO` e `FECHADO` nao entram na carga, pois representam chamados ja solucionados ou encerrados.

## Regras de acesso

| Perfil | Permissoes |
| --- | --- |
| `ADMIN` | Pode criar, editar, excluir, listar e alterar status de qualquer chamado. |
| `SUPORTE` | Pode listar todos os chamados, mas altera status apenas dos chamados atribuidos a ele. |

As regras sao aplicadas no frontend e tambem nas rotas da API.

## Modelo de dados

### Usuario

- `id`
- `nome`
- `email`
- `senha`
- `role`: `ADMIN` ou `SUPORTE`

### Chamado

- `id`
- `titulo`
- `descricao`
- `prioridade`: `BAIXA`, `MEDIA`, `ALTA`
- `status`: `ABERTO`, `EM_ANDAMENTO`, `RESOLVIDO`, `FECHADO`
- `id_responsavel`
- `solicitante_nome`
- `data_abertura`
- `data_solucao`

O campo `solicitante_nome` foi adicionado para registrar quem abriu ou solicitou o atendimento, mesmo sem cadastro completo de funcionarios.

## Rotas principais

### Frontend

| Rota | Descricao |
| --- | --- |
| `/login` | Tela de autenticacao. |
| `/` | Painel de chamados autenticado. |

### API

| Metodo | Rota | Descricao |
| --- | --- | --- |
| `POST` | `/api/auth/login` | Autentica usuario e cria cookie de sessao. |
| `POST` | `/api/auth/logout` | Remove cookie de sessao. |
| `GET` | `/api/auth/me` | Retorna usuario autenticado. |
| `GET` | `/api/responsaveis` | Lista usuarios de suporte. |
| `GET` | `/api/chamados` | Lista chamados com filtros opcionais. |
| `POST` | `/api/chamados` | Cria chamado. Apenas `ADMIN`. |
| `GET` | `/api/chamados/[id]` | Busca chamado por id. |
| `PATCH` | `/api/chamados/[id]` | Atualiza dados do chamado. Apenas `ADMIN`. |
| `DELETE` | `/api/chamados/[id]` | Exclui chamado. Apenas `ADMIN`. |
| `PATCH` | `/api/chamados/[id]/status` | Atualiza status respeitando as regras de perfil. |

## Como rodar

Requisitos:

- Node.js instalado
- npm instalado

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar ambiente

Crie ou mantenha o arquivo `.env` com:

```env
DATABASE_URL="file:./prisma/dev.db"
JWT_SECRET="uma-chave-local-para-desenvolvimento"
```

### 3. Aplicar migrations

```bash
npx prisma migrate dev
```

### 4. Popular banco de dados

```bash
npm run seed
```

### 5. Iniciar aplicacao

```bash
npm run dev
```

Acesse:

```text
http://localhost:3000
```

## Usuarios de teste

Todos os usuarios do seed usam a senha:

```text
senha123
```

| Perfil | E-mail |
| --- | --- |
| `ADMIN` | `ana@empresa.com` |
| `SUPORTE` | `carlos@empresa.com` |
| `SUPORTE` | `fernanda@empresa.com` |
| `SUPORTE` | `marcos@empresa.com` |


## Estrutura

```text
app/                  Rotas, telas e route handlers do Next.js
app/api/              Endpoints da API
components/           Componentes de interface
components/ui/        Componentes base shadcn/ui
lib/                  Auth, Prisma e utilitarios
services/             Regras de negocio
prisma/               Schema, migrations e seed
__test__/             Testes automatizados
```

## Testes e validacao

Comandos usados para validacao:

```bash
npm run build
npm run test
```


## Observacoes

- O proxy do Next protege as telas e APIs privadas.
- A autenticacao usa JWT assinado e armazenado em cookie HTTP-only.
- Chamados fechados nao podem ter o status alterado.
- A distribuicao automatica considera chamados `ABERTO` e `EM_ANDAMENTO` para balancear a carga entre suportes.
- Nao ha tela propria de cadastro de responsaveis; os usuarios de suporte sao criados no seed, conforme permitido pelo desafio.
