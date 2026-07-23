import { NextResponse } from 'next/server'
import { getAccessContext } from '../../../../lib/access'
import { cleanText } from '../../../../lib/validation'
import { calculateMetrics, normalizeComparison } from '../../../../lib/comparison-persistence'

export const runtime = 'nodejs'

export async function GET(_request, context) {
  const access = await getAccessContext()
  if (!access.authenticated || access.mode !== 'supabase') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { id } = await context.params
  const { data, error } = await access.supabase
    .from('comparisons')
    .select('id,title,payload,supplier_count,item_count,max_savings,created_at,updated_at')
    .eq('id', id)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Comparação não encontrada' }, { status: 404 })
  }

  return NextResponse.json({ comparison: data })
}

export async function PATCH(request, context) {
  const access = await getAccessContext()
  if (!access.authenticated || access.mode !== 'supabase') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const { id } = await context.params
    const body = await request.json()
    const comparison = normalizeComparison(body?.comparison)
    const metrics = calculateMetrics(comparison)
    const updates = {
      payload: comparison,
      supplier_count: metrics.supplierCount,
      item_count: metrics.itemCount,
      max_savings: metrics.maxSavings,
      updated_at: new Date().toISOString(),
    }

    if (body?.title) updates.title = cleanText(body.title).slice(0, 120)

    const { data, error } = await access.supabase
      .from('comparisons')
      .update(updates)
      .eq('id', id)
      .select('id,title,updated_at')
      .single()

    if (error || !data) throw error || new Error('Comparação não encontrada')
    return NextResponse.json({ comparison: data })
  } catch (error) {
    console.error('Erro ao atualizar comparação:', error)
    const message = error?.message?.startsWith('Envie entre')
      || error?.message?.startsWith('O limite')
      || error?.message?.startsWith('A comparação')
      ? error.message
      : 'Não foi possível salvar as alterações'
    return NextResponse.json({ error: message }, { status: 400 })
  }
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
