import { NextRequest, NextResponse } from 'next/server'
import { atualizarStatusChamado } from '@/services/chamado'
import { Status } from '@/app/generated/prisma/enums'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id: rawId } = await params
    const id = Number(rawId)

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const body = await req.json()
    const { status } = body

    if (!status) {
      return NextResponse.json({ error: 'Campo obrigatório: status' }, { status: 400 })
    }

    if (!Object.values(Status).includes(status)) {
      return NextResponse.json(
        { error: `Status inválido. Use: ${Object.values(Status).join(', ')}` },
        { status: 400 },
      )
    }

    const chamado = await atualizarStatusChamado(id, status as Status)
    return NextResponse.json(chamado)
  } catch (error) {
    const mensagem = error instanceof Error ? error.message : 'Erro interno'
    const statusMap: Record<string, number> = {
      'Chamado não encontrado': 404,
      'Chamado fechado não pode ter seu status alterado': 422,
    }
    return NextResponse.json({ error: mensagem }, { status: statusMap[mensagem] ?? 500 })
  }
}