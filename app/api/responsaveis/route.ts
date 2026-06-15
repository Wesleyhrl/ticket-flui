import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/withAuth'
import { listarResponsaveis } from '@/services/usuario'

export const GET = withAuth(async () => {
  const responsaveis = await listarResponsaveis()
  return NextResponse.json(responsaveis)
})