import { NextResponse } from 'next/server'
import { getAccessContext } from '../../../lib/access'
import { getBestQuote, getSuppliers } from '../../../lib/comparison'
import {
  cleanText,
  sanitizeGroups,
  sanitizeQuotesInput,
} from '../../../lib/validation'

export const runtime = 'nodejs'

function normalizeComparison(input) {
  const quotes = sanitizeQuotesInput(input?.quotes)
  const validSourceIds = new Set(quotes.map((quote) => quote.id))
  const groups = sanitizeGroups(input?.groups, validSourceIds)

  if (!groups.length) {
    throw new Error('A comparação não possui grupos válidos')
  }

  return { quotes, groups }
}

function calculateMetrics(comparison) {
  const suppliers = getSuppliers(comparison)
  const maxSavings = comparison.groups.reduce((total, group) => {
    const { best, worst } = getBestQuote(group, suppliers)
    return total + (best === null || worst === null ? 0 : worst - best)
  }, 0)

  return {
    supplierCount: suppliers.length,
    itemCount: comparison.groups.length,
    maxSavings: Number(maxSavings.toFixed(2)),
  }
}

export async function GET() {
  const access = await getAccessContext()
  if (!access.authenticated) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  if (access.mode !== 'supabase') {
    return NextResponse.json({ comparisons: [] })
  }

  const { data, error } = await access.supabase
    .from('comparisons')
    .select('id,title,supplier_count,item_count,max_savings,created_at')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    console.error('Erro ao listar comparações:', error)
    return NextResponse.json({ error: 'Não foi possível carregar o histórico' }, { status: 500 })
  }

  return NextResponse.json({ comparisons: data })
}

export async function POST(request) {
  const access = await getAccessContext()
  if (!access.authenticated) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  if (access.mode !== 'supabase' || !access.user?.id) {
    return NextResponse.json({ error: 'O histórico exige uma conta individual' }, { status: 409 })
  }

  try {
    const body = await request.json()
    const comparison = normalizeComparison(body?.comparison)
    const metrics = calculateMetrics(comparison)
    const defaultTitle = `Comparação de ${new Date().toLocaleDateString('pt-BR')}`
    const title = cleanText(body?.title, defaultTitle).slice(0, 120)

    const { data, error } = await access.supabase
      .from('comparisons')
      .insert({
        user_id: access.user.id,
        title,
        supplier_count: metrics.supplierCount,
        item_count: metrics.itemCount,
        max_savings: metrics.maxSavings,
        payload: comparison,
      })
      .select('id,title,created_at')
      .single()

    if (error) throw error
    return NextResponse.json({ comparison: data }, { status: 201 })
  } catch (error) {
    console.error('Erro ao salvar comparação:', error)
    const message = error?.message?.startsWith('Envie entre')
      || error?.message?.startsWith('O limite')
      || error?.message?.startsWith('A comparação')
      ? error.message
      : 'Não foi possível salvar a comparação'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
