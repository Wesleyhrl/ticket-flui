import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { Role } from '@/app/generated/prisma/enums'
import type { Usuario } from '@/app/generated/prisma/client'

// Senha nunca sai do service
type UsuarioPublico = Omit<Usuario, 'senha'>

function semSenha(usuario: Usuario): UsuarioPublico {
  const { senha: _, ...resto } = usuario
  return resto
}

export async function validarCredenciais(
  email: string,
  senha: string,
): Promise<UsuarioPublico> {
  const ERRO = new Error('Credenciais inválidas')

  const usuario = await prisma.usuario.findUnique({
    where: { email: email.toLowerCase().trim() },
  })
  if (!usuario) throw ERRO

  const senhaValida = await bcrypt.compare(senha, usuario.senha)
  if (!senhaValida) throw ERRO

  return semSenha(usuario)
}

export async function listarResponsaveis(): Promise<UsuarioPublico[]> {
  return prisma.usuario.findMany({
    where: { role: Role.SUPORTE },
    select: { id: true, nome: true, email: true, role: true },
    orderBy: { nome: 'asc' },
  })
}