import { NextRequest, NextResponse } from 'next/server'
import { buscarChamadoPorId, atualizarChamado } from '@/services/chamado'
import { Prioridade, Role } from '@/app/generated/prisma/enums'
import prisma from '@/lib/prisma'
import { withAuth } from '@/lib/withAuth'

type Params = { params: Promise<{ id: string }> }

function parseId(raw: string): number | null {
  const id = Number(raw)
  return Number.isInteger(id) && id > 0 ? id : null
}

function statusErroChamado(mensagem: string): number {
  if (mensagem.includes('encontrado')) return 404
  if (mensagem.includes('fechado')) return 422
  return 500
}

export const GET = withAuth<Params>(async (_req: NextRequest, _usuario, { params }) => {
  try {
    const { id: rawId } = await params
    const id = parseId(rawId)

    if (!id) {
      return NextResponse.json({ error: 'ID invalido' }, { status: 400 })
    }

    const chamado = await buscarChamadoPorId(id)
    return NextResponse.json(chamado)
  } catch (error) {
    const mensagem = error instanceof Error ? error.message : 'Erro interno'
    return NextResponse.json({ error: mensagem }, { status: statusErroChamado(mensagem) })
  }
})

export const PATCH = withAuth<Params>(async (req: NextRequest, _usuario, { params }) => {
  try {
    const { id: rawId } = await params
    const id = parseId(rawId)

    if (!id) {
      return NextResponse.json({ error: 'ID invalido' }, { status: 400 })
    }

    const body = await req.json()
    const { titulo, descricao, prioridade, solicitante_nome, id_responsavel } = body

    if (prioridade && !Object.values(Prioridade).includes(prioridade)) {
      return NextResponse.json(
        { error: `Prioridade invalida. Use: ${Object.values(Prioridade).join(', ')}` },
        { status: 400 },
      )
    }

    const chamado = await atualizarChamado(id, {
      titulo,
      descricao,
      prioridade,
      solicitante_nome,
      id_responsavel: id_responsavel === undefined ? undefined : Number(id_responsavel),
    })

    return NextResponse.json(chamado)
  } catch (error) {
    const mensagem = error instanceof Error ? error.message : 'Erro interno'
    return NextResponse.json({ error: mensagem }, { status: statusErroChamado(mensagem) })
  }
}, [Role.ADMIN])

export const DELETE = withAuth<Params>(async (_req: NextRequest, _usuario, { params }) => {
  try {
    const { id: rawId } = await params
    const id = parseId(rawId)

    if (!id) {
      return NextResponse.json({ error: 'ID invalido' }, { status: 400 })
    }

    await buscarChamadoPorId(id)
    await prisma.chamado.delete({ where: { id } })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    const mensagem = error instanceof Error ? error.message : 'Erro interno'
    return NextResponse.json({ error: mensagem }, { status: statusErroChamado(mensagem) })
  }
}, [Role.ADMIN])
