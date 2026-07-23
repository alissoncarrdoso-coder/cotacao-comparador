import { getBestQuote, getSuppliers } from './comparison'
import { cleanText, sanitizeGroups, sanitizeQuotesInput } from './validation'

export function normalizeComparison(input) {
  const quotes = sanitizeQuotesInput(input?.quotes)
  const validSourceIds = new Set(quotes.map((quote) => quote.id))
  const groups = sanitizeGroups(input?.groups, validSourceIds, { allowEmpty: true })

  if (!groups.length) {
    throw new Error('A comparação não possui grupos válidos')
  }

  const meta = input?.meta && typeof input.meta === 'object'
    ? {
        processingMode: cleanText(input.meta.processingMode),
        localConfidence: Number(input.meta.localConfidence || 0),
        createdAt: cleanText(input.meta.createdAt),
      }
    : undefined

  return { quotes, groups, ...(meta ? { meta } : {}) }
}

export function calculateMetrics(comparison) {
  const suppliers = getSuppliers(comparison)
  const maxSavings = comparison.groups.reduce((total, group) => {
    const { best, worst } = getBestQuote(group, suppliers)
    return total + (best === null || worst === null
      ? 0
      : (worst - best) * Number(group.quantity || 1))
  }, 0)

  return {
    supplierCount: suppliers.length,
    itemCount: comparison.groups.length,
    maxSavings: Number(maxSavings.toFixed(2)),
  }
}
