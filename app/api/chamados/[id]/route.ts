import { NextRequest, NextResponse } from 'next/server'
import { buscarChamadoPorId, atualizarChamado } from '@/services/chamado'
import { Prioridade } from '@/app/generated/prisma/enums'
import prisma from '@/lib/prisma'

type Params = { params: Promise<{ id: string }> }

function parseId(raw: string): number | null {
  const id = Number(raw)
  return Number.isInteger(id) && id > 0 ? id : null
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id: rawId } = await params
    const id = parseId(rawId)

    if (!id) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const chamado = await buscarChamadoPorId(id)
    return NextResponse.json(chamado)
  } catch (error) {
    const mensagem = error instanceof Error ? error.message : 'Erro interno'
    const status = mensagem === 'Chamado não encontrado' ? 404 : 500
    return NextResponse.json({ error: mensagem }, { status })
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id: rawId } = await params
    const id = parseId(rawId)

    if (!id) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const body = await req.json()
    const { titulo, descricao, prioridade, solicitante_nome, id_responsavel } = body

    if (prioridade && !Object.values(Prioridade).includes(prioridade)) {
      return NextResponse.json(
        { error: `Prioridade inválida. Use: ${Object.values(Prioridade).join(', ')}` },
        { status: 400 },
      )
    }

    const chamado = await atualizarChamado(id, {
      titulo,
      descricao,
      prioridade,
      solicitante_nome,
      id_responsavel: id_responsavel ? Number(id_responsavel) : undefined,
    })

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

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id: rawId } = await params
    const id = parseId(rawId)

    if (!id) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    await buscarChamadoPorId(id) // lança 'Chamado não encontrado' se não existir

    await prisma.chamado.delete({ where: { id } })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    const mensagem = error instanceof Error ? error.message : 'Erro interno'
    const status = mensagem === 'Chamado não encontrado' ? 404 : 500
    return NextResponse.json({ error: mensagem }, { status })
  }
}