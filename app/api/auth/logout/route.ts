import { NextResponse } from 'next/server'
import { COOKIE_NAME } from '../../../../lib/auth'

export function POST() {
  const response = NextResponse.json({ mensagem: 'Logout realizado com sucesso' })
  response.cookies.delete(COOKIE_NAME)
  return response
}