import prisma from '../lib/prisma'
import { Status, Role } from '../app/generated/prisma/enums'
import type { Usuario } from '../app/generated/prisma/client'

const STATUS_EM_ABERTO: Status[] = [Status.ABERTO, Status.EM_ANDAMENTO]

type ResponsavelComCarga = Usuario & { totalEmAberto: number }

export async function selecionarResponsavelAutomatico(): Promise<Usuario> {
  const responsaveis = await prisma.usuario.findMany({
    where: { role: Role.SUPORTE },
  })

  if (responsaveis.length === 0) {
    throw new Error('Nenhum responsável disponível para atribuição')
  }

  const responsaveisComCarga: ResponsavelComCarga[] = await Promise.all(
    responsaveis.map(async (responsavel) => {
      const totalEmAberto = await prisma.chamado.count({
        where: {
          id_responsavel: responsavel.id,
          status: { in: STATUS_EM_ABERTO },
        },
      })
      return { ...responsavel, totalEmAberto }
    }),
  )

  responsaveisComCarga.sort((a, b) => a.totalEmAberto - b.totalEmAberto)

  const { totalEmAberto: _, ...responsavelSelecionado } = responsaveisComCarga[0]
  return responsavelSelecionado
}