import { Prioridade, Status } from '@/app/generated/prisma/enums'
import { criarChamado, atualizarStatusChamado } from '@/services/chamado'
import { selecionarResponsavelAutomatico } from '@/services/destribuicao'



jest.mock('@/services/destribuicao', () => ({
  selecionarResponsavelAutomatico: jest.fn(),
}))

// --- Mocks do Prisma ---
const mockCreate     = jest.fn()
const mockFindUnique = jest.fn()
const mockUpdate     = jest.fn()

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    chamado: {
      create:     (...args: any[]) => mockCreate(...args),
      findUnique: (...args: any[]) => mockFindUnique(...args),
      update:     (...args: any[]) => mockUpdate(...args),
    },
  },
}))

// --- Fixtures ---
const DADOS_VALIDOS = {
  titulo:          'Computador não liga',
  descricao:       'O PC do setor financeiro parou ontem.',
  prioridade:      Prioridade.ALTA,
  id_responsavel:  1,
  solicitante_nome: 'João Souza',
}


describe('criarChamado', () => {
  beforeEach(() => jest.clearAllMocks())


  it('deve criar um chamado com dados válidos', async () => {
    const chamadoCriado = { id: 1, ...DADOS_VALIDOS, status: Status.ABERTO, data_abertura: new Date() }
    mockCreate.mockResolvedValue(chamadoCriado)

    const resultado = await criarChamado(DADOS_VALIDOS)

    expect(resultado.id).toBe(1)
    expect(mockCreate).toHaveBeenCalledTimes(1)
  })


  it('deve forçar status ABERTO ao criar, independentemente do input', async () => {
    mockCreate.mockResolvedValue({ id: 1, status: Status.ABERTO })

    await criarChamado(DADOS_VALIDOS)

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: Status.ABERTO }),
      }),
    )
  })


  it('deve lançar erro se o título estiver vazio', async () => {
    await expect(criarChamado({ ...DADOS_VALIDOS, titulo: '' }))
      .rejects.toThrow('Título é obrigatório')
  })

  it('deve lançar erro se o título for apenas espaços em branco', async () => {
    await expect(criarChamado({ ...DADOS_VALIDOS, titulo: '   ' }))
      .rejects.toThrow('Título é obrigatório')
  })


it('deve lançar erro se id_responsavel não for informado e a distribuição automática falhar em trazer um ID válido', async () => {
    // Simulamos que a distribuição automática falhou e retornou um usuário com id inválido (0)
    (selecionarResponsavelAutomatico as jest.Mock).mockResolvedValue({ id: 0 })

    await expect(criarChamado({ ...DADOS_VALIDOS, id_responsavel: 0 }))
      .rejects.toThrow('Responsável é obrigatório')
  })
})


describe('atualizarStatusChamado', () => {
  beforeEach(() => jest.clearAllMocks())

  it('deve atualizar o status de ABERTO para EM_ANDAMENTO', async () => {
    mockFindUnique.mockResolvedValue({ id: 1, status: Status.ABERTO })
    mockUpdate.mockResolvedValue({ id: 1, status: Status.EM_ANDAMENTO })

    const resultado = await atualizarStatusChamado(1, Status.EM_ANDAMENTO)

    expect(resultado.status).toBe(Status.EM_ANDAMENTO)
  })


  it('deve lançar erro se o chamado não existir', async () => {
    mockFindUnique.mockResolvedValue(null)

    await expect(atualizarStatusChamado(999, Status.EM_ANDAMENTO))
      .rejects.toThrow('Chamado não encontrado')
  })


  it('deve impedir qualquer alteração em chamado FECHADO', async () => {
    mockFindUnique.mockResolvedValue({ id: 1, status: Status.FECHADO })

    await expect(atualizarStatusChamado(1, Status.ABERTO))
      .rejects.toThrow('Chamado fechado não pode ter seu status alterado')
  })


  it('deve registrar data_solucao ao marcar como RESOLVIDO', async () => {
    mockFindUnique.mockResolvedValue({ id: 1, status: Status.EM_ANDAMENTO })
    mockUpdate.mockResolvedValue({ id: 1, status: Status.RESOLVIDO, data_solucao: new Date() })

    await atualizarStatusChamado(1, Status.RESOLVIDO)

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          data_solucao: expect.any(Date),
        }),
      }),
    )
  })

  it('deve limpar data_solucao ao reabrir um chamado RESOLVIDO', async () => {
    mockFindUnique.mockResolvedValue({ id: 1, status: Status.RESOLVIDO })
    mockUpdate.mockResolvedValue({ id: 1, status: Status.EM_ANDAMENTO, data_solucao: null })

    await atualizarStatusChamado(1, Status.EM_ANDAMENTO)

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ data_solucao: null }),
      }),
    )
  })
})