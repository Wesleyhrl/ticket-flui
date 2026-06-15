import { PrismaClient } from '../app/generated/prisma/client'
import { Role, Status, Prioridade } from '../app/generated/prisma/enums'
import { hash } from 'bcryptjs'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

const adapter = new PrismaBetterSqlite3({ url: "file:./prisma/dev.db" })

const prisma = new PrismaClient({ adapter })

async function main() {

  await prisma.chamado.deleteMany()
  await prisma.usuario.deleteMany()


  const senhaHash = await hash('senha123', 10)

  const admin = await prisma.usuario.create({
    data: {
      nome: 'Ana Administrativa',
      email: 'ana@empresa.com',
      senha: senhaHash,
      role: Role.ADMIN,
    },
  })

  const suporte1 = await prisma.usuario.create({
    data: {
      nome: 'Carlos Suporte',
      email: 'carlos@empresa.com',
      senha: senhaHash,
      role: Role.SUPORTE,
    },
  })

  const suporte2 = await prisma.usuario.create({
    data: {
      nome: 'Fernanda TI',
      email: 'fernanda@empresa.com',
      senha: senhaHash,
      role: Role.SUPORTE,
    },
  })

  const suporte3 = await prisma.usuario.create({
    data: {
      nome: 'Marcos Helpdesk',
      email: 'marcos@empresa.com',
      senha: senhaHash,
      role: Role.SUPORTE,
    },
  })

  console.log(`Usuários criados: ${admin.nome}, ${suporte1.nome}, ${suporte2.nome}, ${suporte3.nome}`)

  const chamados = await prisma.chamado.createMany({
    data: [
      {
        titulo: 'Computador travando constantemente',
        descricao: 'Meu computador trava toda vez que abro o Excel. Já reiniciei várias vezes e o problema persiste.',
        prioridade: Prioridade.ALTA,
        status: Status.EM_ANDAMENTO,
        id_responsavel: suporte1.id,
        solicitante_nome: 'João da Contabilidade',
        data_abertura: new Date('2026-06-10T08:30:00'),
      },
      {
        titulo: 'Impressora do 2º andar não imprime',
        descricao: 'A impressora HP do segundo andar está offline. Vários funcionários precisam usá-la urgentemente.',
        prioridade: Prioridade.ALTA,
        status: Status.ABERTO,
        id_responsavel: suporte2.id,
        solicitante_nome: 'Maria do RH',
        data_abertura: new Date('2026-06-11T09:15:00'),
      },
      {
        titulo: 'Solicitar cadeira ergonômica',
        descricao: 'Preciso de uma cadeira ergonômica por recomendação médica. Tenho o laudo em mãos.',
        prioridade: Prioridade.MEDIA,
        status: Status.ABERTO,
        id_responsavel: suporte3.id,
        solicitante_nome: 'Pedro do Financeiro',
        data_abertura: new Date('2026-06-12T14:00:00'),
      },
      {
        titulo: 'Sem acesso ao sistema de ponto',
        descricao: 'Não consigo fazer login no sistema de ponto eletrônico desde segunda-feira. Aparece erro de credenciais.',
        prioridade: Prioridade.MEDIA,
        status: Status.RESOLVIDO,
        id_responsavel: suporte1.id,
        solicitante_nome: 'Luciana do DP',
        data_abertura: new Date('2026-06-09T07:45:00'),
        data_solucao: new Date('2026-06-09T11:20:00'),
      },
      {
        titulo: 'Trocar lâmpada queimada na sala de reunião',
        descricao: 'Duas lâmpadas da sala de reunião principal estão queimadas. Temos apresentação importante na sexta.',
        prioridade: Prioridade.BAIXA,
        status: Status.FECHADO,
        id_responsavel: suporte2.id,
        solicitante_nome: 'Roberto da Diretoria',
        data_abertura: new Date('2026-06-08T10:00:00'),
        data_solucao: new Date('2026-06-08T16:30:00'),
      },
    ],
  })

  console.log(`${chamados.count} chamados criados`)
  console.log('Seed concluído com sucesso!')
}

main()
  .catch((e) => {
    console.error('Erro no seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })