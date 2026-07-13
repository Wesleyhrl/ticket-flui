# Ticket Flui

Sistema web para gerenciamento de atendimentos desenvolvido para otimizar a rotina de pequenas equipes de suporte e assistências técnicas.

A aplicação centraliza solicitações, organiza a fila de atendimentos, distribui demandas entre responsáveis e acompanha todo o ciclo do atendimento, proporcionando maior controle operacional e produtividade.

> Projeto desenvolvido utilizando arquitetura Full Stack com Next.js, priorizando organização de código, escalabilidade, segurança e boas práticas de desenvolvimento.

---

## Objetivo

Pequenas empresas frequentemente utilizam planilhas, mensagens ou processos manuais para controlar atendimentos, dificultando o acompanhamento das solicitações e a distribuição equilibrada da carga de trabalho.

O Ticket Flui foi desenvolvido para solucionar esse problema oferecendo uma plataforma simples e intuitiva para gerenciamento de atendimentos, permitindo que administradores e equipes acompanhem todo o fluxo de trabalho em um único ambiente.

---

# Principais funcionalidades

- Autenticação utilizando JWT com cookie HTTP-only.
- Login e logout seguros.
- Cadastro de atendimentos.
- Edição de atendimentos.
- Exclusão de atendimentos.
- Listagem completa de atendimentos.
- Pesquisa textual.
- Filtros por prioridade.
- Filtros por status.
- Atribuição manual de responsável.
- Distribuição automática do atendimento.
- Controle de permissões por perfil.
- Atualização de status.
- Registro automático da data de conclusão.
- Interface responsiva.

---

# Tecnologias

- Next.js 16
- React 19
- TypeScript
- Prisma ORM 7
- SQLite
- Tailwind CSS 4
- shadcn/ui
- Lucide React
- JWT
- Jest

---

# Arquitetura

O projeto foi desenvolvido utilizando uma arquitetura Full Stack baseada no App Router do Next.js.

Toda a aplicação está centralizada em um único projeto, concentrando:

- Frontend
- Backend
- APIs
- Regras de negócio
- Persistência de dados

Essa abordagem reduz complexidade, facilita manutenção e acelera o desenvolvimento.

## Segurança

- Autenticação baseada em JWT.
- Cookie HTTP-only.
- Controle de acesso por perfil.
- Proteção das rotas privadas.
- Validação de permissões tanto no frontend quanto na API.

## Services

Toda regra de negócio permanece desacoplada das rotas HTTP.

Entre elas:

- validações
- distribuição automática
- regras de acesso
- atualização de status

## Fluxo de distribuição automática

Ao criar um atendimento sem selecionar um responsável, o sistema realiza automaticamente a distribuição para o colaborador com menor quantidade de atendimentos em aberto.

Para cálculo da carga são considerados apenas os status:

- ABERTO
- EM_ANDAMENTO

Atendimentos finalizados não entram no cálculo.

Essa estratégia contribui para um balanceamento mais eficiente da equipe.

---

# Controle de acesso

| Perfil | Permissões |
| ------- | ---------- |
| ADMIN | Gerencia todos os atendimentos, usuários responsáveis e alterações do sistema. |
| SUPORTE | Visualiza todos os atendimentos e altera apenas os atendimentos atribuídos a ele. |

As permissões são aplicadas tanto na interface quanto na API.

---

# Rotas principais

## Frontend

| Rota | Descrição |
|------|-----------|
| /login | Tela de autenticação |
| / | Painel principal |

---

## API

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | /api/auth/login | Autenticação |
| POST | /api/auth/logout | Encerrar sessão |
| GET | /api/auth/me | Usuário autenticado |
| GET | /api/responsaveis | Lista responsáveis |
| GET | /api/chamados | Lista atendimentos |
| POST | /api/chamados | Cria atendimento |
| GET | /api/chamados/[id] | Busca atendimento |
| PATCH | /api/chamados/[id] | Atualiza atendimento |
| DELETE | /api/chamados/[id] | Remove atendimento |
| PATCH | /api/chamados/[id]/status | Atualiza status |

---

# Como executar

## Pré-requisitos

- Node.js
- npm

---

### Instalação

```bash
npm install
```

---

### Configuração

Crie um arquivo `.env`

```env
DATABASE_URL="file:./prisma/dev.db"
JWT_SECRET="uma-chave-local-para-desenvolvimento"
```

---

### Executar migrations

```bash
npx prisma migrate dev
```

---

### Popular banco

```bash
npm run seed
```

---

### Executar projeto

```bash
npm run dev
```

Acesse:

```
http://localhost:3000
```

---

# Usuários de demonstração

Senha utilizada por todos:

```
senha123
```

| Perfil | E-mail |
|---------|--------|
| ADMIN | ana@empresa.com |
| SUPORTE | carlos@empresa.com |
| SUPORTE | fernanda@empresa.com |
| SUPORTE | marcos@empresa.com |

---

# Testes

Executar build

```bash
npm run build
```

Executar testes

```bash
npm run test
```