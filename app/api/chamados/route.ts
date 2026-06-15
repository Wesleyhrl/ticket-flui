import { NextRequest, NextResponse } from 'next/server'
import { criarChamado, listarChamados } from '@/services/chamado'
import { Status, Prioridade } from '@/app/generated/prisma/enums'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl

    const statusParam = searchParams.get('status') as Status | null
    const prioridadeParam = searchParams.get('prioridade') as Prioridade | null
    const responsavelParam = searchParams.get('id_responsavel')

    const filtros = {
      ...(statusParam && Object.values(Status).includes(statusParam) && { status: statusParam }),
      ...(prioridadeParam && Object.values(Prioridade).includes(prioridadeParam) && { prioridade: prioridadeParam }),
      ...(responsavelParam && { id_responsavel: Number(responsavelParam) }),
    }

    const chamados = await listarChamados(filtros)
    return NextResponse.json(chamados)
  } catch (error) {
    console.error('[GET /api/chamados]', error)
    return NextResponse.json(
      { error: 'Erro ao listar chamados' },
      { status: 500 },
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const { titulo, descricao, prioridade, solicitante_nome, id_responsavel } = body

    if (!titulo || !prioridade) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: titulo, prioridade' },
        { status: 400 },
      )
    }

    if (!Object.values(Prioridade).includes(prioridade)) {
      return NextResponse.json(
        { error: `Prioridade inválida. Use: ${Object.values(Prioridade).join(', ')}` },
        { status: 400 },
      )
    }

    const chamado = await criarChamado({
      titulo,
      descricao,
      prioridade,
      solicitante_nome,
      id_responsavel: id_responsavel ? Number(id_responsavel) : undefined,
    })

    return NextResponse.json(chamado, { status: 201 })
  } catch (error) {
    console.error('[POST /api/chamados]', error)
    const mensagem = error instanceof Error ? error.message : 'Erro ao criar chamado'
    return NextResponse.json({ error: mensagem }, { status: 500 })
  }
}