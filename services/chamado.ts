import prisma from '../lib/prisma'
import { Chamado, Prioridade, Status } from '../app/generated/prisma'
import { selecionarResponsavelAutomatico } from './distribuicaoAutomaticaService'

// ────────────────────────────────────────────────────────────
// Tipos de input
// ────────────────────────────────────────────────────────────

export interface CriarChamadoInput {
  titulo: string
  descricao?: string
  prioridade: Prioridade
  solicitante_nome?: string
  // Quando não informado, usa distribuição automática
  id_responsavel?: number
}

export interface AtualizarChamadoInput {
  titulo?: string
  descricao?: string
  prioridade?: Prioridade
  solicitante_nome?: string
  id_responsavel?: number
}

// ────────────────────────────────────────────────────────────
// Validações (puras — fáceis de testar unitariamente)
// ────────────────────────────────────────────────────────────

function validarTitulo(titulo: string): void {
  if (!titulo || titulo.trim() === '') {
    throw new Error('Título é obrigatório')
  }
}

function validarResponsavel(id: number): void {
  if (!id || id <= 0) {
    throw new Error('Responsável é obrigatório')
  }
}

function validarChamadoNaoFechado(chamado: Chamado): void {
  if (chamado.status === Status.FECHADO) {
    throw new Error('Chamado fechado não pode ter seu status alterado')
  }
}

// ────────────────────────────────────────────────────────────
// CRUD
// ────────────────────────────────────────────────────────────

export async function criarChamado(data: CriarChamadoInput): Promise<Chamado> {
  validarTitulo(data.titulo)

  // Resolve responsável: manual ou automático
  const id_responsavel = data.id_responsavel
    ? data.id_responsavel
    : (await selecionarResponsavelAutomatico()).id

  validarResponsavel(id_responsavel)

  return prisma.chamado.create({
    data: {
      titulo:          data.titulo.trim(),
      descricao:       data.descricao,
      prioridade:      data.prioridade,
      status:          Status.ABERTO,   // sempre começa ABERTO
      id_responsavel,
      solicitante_nome: data.solicitante_nome,
    },
  })
}

export async function listarChamados(filtros?: {
  status?: Status
  prioridade?: Prioridade
  id_responsavel?: number
}): Promise<Chamado[]> {
  return prisma.chamado.findMany({
    where: {
      ...(filtros?.status        && { status: filtros.status }),
      ...(filtros?.prioridade    && { prioridade: filtros.prioridade }),
      ...(filtros?.id_responsavel && { id_responsavel: filtros.id_responsavel }),
    },
    orderBy: [
      // ALTA primeiro, depois pela mais antiga
      { prioridade: 'desc' },
      { data_abertura: 'asc' },
    ],
    include: { responsavel: { select: { id: true, nome: true, email: true } } },
  })
}

export async function buscarChamadoPorId(id: number): Promise<Chamado> {
  const chamado = await prisma.chamado.findUnique({
    where: { id },
    include: { responsavel: { select: { id: true, nome: true, email: true } } },
  })

  if (!chamado) {
    throw new Error('Chamado não encontrado')
  }

  return chamado
}

export async function atualizarChamado(
  id: number,
  data: AtualizarChamadoInput,
): Promise<Chamado> {
  const chamado = await buscarChamadoPorId(id)

  // Não permite editar campos de chamado fechado
  validarChamadoNaoFechado(chamado)

  if (data.titulo !== undefined) {
    validarTitulo(data.titulo)
  }

  if (data.id_responsavel !== undefined) {
    validarResponsavel(data.id_responsavel)
  }

  return prisma.chamado.update({
    where: { id },
    data: {
      ...(data.titulo          !== undefined && { titulo: data.titulo.trim() }),
      ...(data.descricao       !== undefined && { descricao: data.descricao }),
      ...(data.prioridade      !== undefined && { prioridade: data.prioridade }),
      ...(data.solicitante_nome !== undefined && { solicitante_nome: data.solicitante_nome }),
      ...(data.id_responsavel  !== undefined && { id_responsavel: data.id_responsavel }),
    },
  })
}

// ────────────────────────────────────────────────────────────
// Transição de status (regra de negócio isolada)
// ────────────────────────────────────────────────────────────

export async function atualizarStatusChamado(){
    
}
