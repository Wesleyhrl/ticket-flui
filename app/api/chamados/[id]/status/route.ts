import { NextRequest, NextResponse } from 'next/server'
import { atualizarStatusChamado, buscarChamadoPorId } from '@/services/chamado'
import { Role, Status } from '@/app/generated/prisma/enums'
import { withAuth } from '@/lib/withAuth'

type Params = { params: Promise<{ id: string }> }

function statusErroChamado(mensagem: string): number {
  if (mensagem.includes('encontrado')) return 404
  if (mensagem.includes('fechado')) return 422
  return 500
}

export const PATCH = withAuth<Params>(async (req: NextRequest, usuario, { params }) => {
  try {
    const { id: rawId } = await params
    const id = Number(rawId)

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: 'ID invalido' }, { status: 400 })
    }

    const body = await req.json()
    const { status } = body

    if (!status) {
      return NextResponse.json({ error: 'Campo obrigatorio: status' }, { status: 400 })
    }

    if (!Object.values(Status).includes(status)) {
      return NextResponse.json(
        { error: `Status invalido. Use: ${Object.values(Status).join(', ')}` },
        { status: 400 },
      )
    }

    const chamadoAtual = await buscarChamadoPorId(id)

    if (usuario.role === Role.SUPORTE && chamadoAtual.id_responsavel !== usuario.id) {
      return NextResponse.json(
        { error: 'Suporte pode alterar apenas chamados atribuidos a ele' },
        { status: 403 },
      )
    }

    const chamado = await atualizarStatusChamado(id, status as Status)
    return NextResponse.json(chamado)
  } catch (error) {
    const mensagem = error instanceof Error ? error.message : 'Erro interno'
    return NextResponse.json({ error: mensagem }, { status: statusErroChamado(mensagem) })
  }
})
