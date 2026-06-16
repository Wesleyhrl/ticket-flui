import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/withAuth'

export const GET = withAuth(async (_request: NextRequest, usuario) => {
  return NextResponse.json({ usuario })
})
