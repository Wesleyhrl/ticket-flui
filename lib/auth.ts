import { SignJWT, jwtVerify } from 'jose'
import type { Role } from '../app/generated/prisma/enums'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'dev-fallback-nao-usar-em-producao',
)

export const COOKIE_NAME = 'auth_token'

export interface JwtPayload {
  id: number
  email: string
  role: Role
}

export async function assinarToken(payload: JwtPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(JWT_SECRET)
}

export async function verificarToken(token: string): Promise<JwtPayload> {
  const { payload } = await jwtVerify(token, JWT_SECRET)
  return payload as unknown as JwtPayload
}