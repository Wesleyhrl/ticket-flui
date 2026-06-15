import { NextRequest, NextResponse } from 'next/server'
import { verificarToken, COOKIE_NAME } from './lib/auth'

const ROTAS_PUBLICAS = ['/api/auth/login', '/api/auth/logout']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const ehRotaPublica = ROTAS_PUBLICAS.some((r) => pathname.startsWith(r))
  if (!pathname.startsWith('/api') || ehRotaPublica) {
    return NextResponse.next()
  }

  const token = request.cookies.get(COOKIE_NAME)?.value

  if (!token) {
    return NextResponse.json({ erro: 'Não autenticado' }, { status: 401 })
  }

  try {
    await verificarToken(token)
    return NextResponse.next()
  } catch {
    return NextResponse.json({ erro: 'Token inválido ou expirado' }, { status: 401 })
  }
}

export const config = {
  matcher: '/api/:path*',
}