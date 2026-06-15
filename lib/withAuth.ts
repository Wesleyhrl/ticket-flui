import { NextRequest, NextResponse } from 'next/server'
import { verificarToken, JwtPayload, COOKIE_NAME } from './auth'
import { Role } from '../app/generated/prisma/enums'

type HandlerAutenticado<P = unknown> = (
  request: NextRequest,
  usuario: JwtPayload,
  context: P,
) => Promise<NextResponse>

export function withAuth<P = unknown>(
  handler: HandlerAutenticado<P>,
  rolesPermitidas?: Role[],
) {
  return async (request: NextRequest, context: P): Promise<NextResponse> => {
    const token = request.cookies.get(COOKIE_NAME)?.value

    if (!token) {
      return NextResponse.json({ erro: 'Não autenticado' }, { status: 401 })
    }

    let usuario: JwtPayload
    try {
      usuario = await verificarToken(token)
    } catch {
      return NextResponse.json({ erro: 'Token inválido ou expirado' }, { status: 401 })
    }

    if (rolesPermitidas && !rolesPermitidas.includes(usuario.role)) {
      return NextResponse.json(
        { erro: `Acesso negado. Requer: ${rolesPermitidas.join(' ou ')}` },
        { status: 403 },
      )
    }

    return handler(request, usuario, context)
  }
}