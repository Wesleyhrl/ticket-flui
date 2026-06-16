import { NextRequest, NextResponse } from 'next/server'
import { verificarToken, COOKIE_NAME } from './lib/auth'

// Separa as rotas públicas para tratar frontend e backend de formas diferentes
const ROTAS_PUBLICAS_API = ['/api/auth/login', '/api/auth/logout']
const ROTAS_PUBLICAS_FRONT = ['/login']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Identifica que tipo de rota está sendo acessada
  const ehRotaApi = pathname.startsWith('/api')
  const ehRotaPublicaApi = ROTAS_PUBLICAS_API.some((r) => pathname.startsWith(r))
  const ehRotaPublicaFront = ROTAS_PUBLICAS_FRONT.some((r) => pathname.startsWith(r))

  // Extraí o token do cookie
  const token = request.cookies.get(COOKIE_NAME)?.value

  // Valida o token de forma segura
  let tokenValido = false
  if (token) {
    try {
      await verificarToken(token)
      tokenValido = true
    } catch {
      tokenValido = false
    }
  }

  // REGRA A: Rotas de Backend (API)
  if (ehRotaApi) {
    if (ehRotaPublicaApi) {
      return NextResponse.next()
    }
    if (!tokenValido) {
      return NextResponse.json(
        { erro: 'Não autenticado ou token inválido' }, 
        { status: 401 }
      )
    }
    return NextResponse.next()
  }

  // REGRA B: Rotas de Frontend (Telas)
  
  if (ehRotaPublicaFront && tokenValido) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  if (!ehRotaPublicaFront && !tokenValido) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Aplica o proxy a todas as rotas do Next.js exceto:
     * - _next/static (arquivos javascript, css, etc)
     * - _next/image (otimização nativa de imagens)
     * - favicon.ico (ícone do navegador)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}