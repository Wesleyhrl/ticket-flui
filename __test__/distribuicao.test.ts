import { selecionarResponsavelAutomatico } from "@/services/destribuicao"

selecionarResponsavelAutomatico


const mockUsuarioFindMany = jest.fn()
const mockChamadoCount = jest.fn()

jest.mock('../../lib/prisma', () => ({
  __esModule: true,
  default: {
    usuario: {
      findMany: (...args: any[]) => mockUsuarioFindMany(...args),
    },
    chamado: {
      count: (...args: any[]) => mockChamadoCount(...args),
    },
  },
}))


const RESPONSAVEIS_MOCK = [
  { id: 1, nome: 'Ana Silva',   email: 'ana@empresa.com',   role: 'SUPORTE' },
  { id: 2, nome: 'Bruno Costa', email: 'bruno@empresa.com', role: 'SUPORTE' },
  { id: 3, nome: 'Carla Dias',  email: 'carla@empresa.com', role: 'SUPORTE' },
]


describe('selecionarResponsavelAutomatico', () => {
  beforeEach(() => jest.clearAllMocks())


  it('deve retornar o responsável com menos chamados em aberto', async () => {
    mockUsuarioFindMany.mockResolvedValue(RESPONSAVEIS_MOCK)
    // Ana=5, Bruno=2, Carla=8
    mockChamadoCount
      .mockResolvedValueOnce(5)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(8)

    const resultado = await selecionarResponsavelAutomatico()

    expect(resultado.id).toBe(2)
    expect(resultado.nome).toBe('Bruno Costa')
  })


  it('deve retornar um responsável válido quando todos têm 0 chamados abertos', async () => {
    mockUsuarioFindMany.mockResolvedValue(RESPONSAVEIS_MOCK)
    mockChamadoCount.mockResolvedValue(0)

    const resultado = await selecionarResponsavelAutomatico()

    expect(resultado).toBeDefined()
    expect(resultado.id).toBeDefined()
  })

  it('deve retornar um dos empatados sem lançar erro quando há empate', async () => {
    mockUsuarioFindMany.mockResolvedValue(RESPONSAVEIS_MOCK)
    mockChamadoCount.mockResolvedValue(3) // todos com 3

    const resultado = await selecionarResponsavelAutomatico()

    const idsValidos = RESPONSAVEIS_MOCK.map((r) => r.id)
    expect(idsValidos).toContain(resultado.id)
  })


  it('deve contar apenas chamados ABERTO e EM_ANDAMENTO como "em aberto"', async () => {
    mockUsuarioFindMany.mockResolvedValue([RESPONSAVEIS_MOCK[0]])
    mockChamadoCount.mockResolvedValue(2)

    await selecionarResponsavelAutomatico()

    expect(mockChamadoCount).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: { in: ['ABERTO', 'EM_ANDAMENTO'] },
        }),
      }),
    )
  })


  it('deve lançar erro quando não há responsáveis cadastrados', async () => {
    mockUsuarioFindMany.mockResolvedValue([])

    await expect(selecionarResponsavelAutomatico()).rejects.toThrow(
      'Nenhum responsável disponível para atribuição',
    )
  })
})