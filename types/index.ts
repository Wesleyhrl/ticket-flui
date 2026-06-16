export type Prioridade = 'BAIXA' | 'MEDIA' | 'ALTA';
export type Status = 'ABERTO' | 'EM_ANDAMENTO' | 'RESOLVIDO' | 'FECHADO';

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  role: string;
}

export interface Chamado {
  id: number;
  titulo: string;
  descricao: string;
  prioridade: Prioridade;
  status: Status;
  solicitante_nome: string;
  id_responsavel: number | null;
  criadoEm?: string;
  atualizadoEm?: string;
}