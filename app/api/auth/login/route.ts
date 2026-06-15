import { NextRequest, NextResponse } from 'next/server'
import { validarCredenciais } from '@/services/usuario'
import { assinarToken, COOKIE_NAME } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { email, senha } = await request.json()

    if (!email || !senha) {
      return NextResponse.json(
        { erro: 'E-mail e senha são obrigatórios' },
        { status: 400 },
      )
    }

    const usuario = await validarCredenciais(email, senha)
    const token   = await assinarToken({
      id:    usuario.id,
      email: usuario.email,
      role:  usuario.role,
    })

    const response = NextResponse.json({
      mensagem: 'Login realizado com sucesso',
      usuario: {
        id:    usuario.id,
        nome:  usuario.nome,
        email: usuario.email,
        role:  usuario.role,
      },
    })

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge:   60 * 60 * 8, // 8 horas
      path:     '/',
    })

    return response
  } catch (erro) {
    if (erro instanceof Error && erro.message === 'Credenciais inválidas') {
      return NextResponse.json(
        { erro: 'E-mail ou senha incorretos' },
        { status: 401 },
      )
    }
    console.error('[POST /api/auth/login]', erro)
    return NextResponse.json({ erro: 'Erro interno do servidor' }, { status: 500 })
  }
}