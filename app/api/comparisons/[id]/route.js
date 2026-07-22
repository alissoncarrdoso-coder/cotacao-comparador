import { NextResponse } from 'next/server'
import { getAccessContext } from '../../../../lib/access'

export const runtime = 'nodejs'

export async function GET(_request, context) {
  const access = await getAccessContext()
  if (!access.authenticated || access.mode !== 'supabase') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { id } = await context.params
  const { data, error } = await access.supabase
    .from('comparisons')
    .select('id,title,payload,supplier_count,item_count,max_savings,created_at')
    .eq('id', id)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Comparação não encontrada' }, { status: 404 })
  }

  return NextResponse.json({ comparison: data })
}

export async function DELETE(_request, context) {
  const access = await getAccessContext()
  if (!access.authenticated || access.mode !== 'supabase') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { id } = await context.params
  const { error } = await access.supabase
    .from('comparisons')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Erro ao excluir comparação:', error)
    return NextResponse.json({ error: 'Não foi possível excluir a comparação' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
