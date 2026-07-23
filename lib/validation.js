const MAX_TEXT_LENGTH = 300

export function cleanText(value, fallback = '') {
  if (typeof value !== 'string') return fallback
  const text = value.trim().slice(0, MAX_TEXT_LENGTH)
  return text || fallback
}

export function toNonNegativeNumber(value, fallback = 0) {
  if (typeof value === 'number') {
    return Number.isFinite(value) && value >= 0 ? value : fallback
  }

  if (typeof value !== 'string') return fallback

  let normalized = value.trim().replace(/[^0-9,.-]/g, '')
  if (normalized.includes(',')) {
    normalized = normalized.replace(/\./g, '').replace(',', '.')
  }

  const parsed = Number(normalized)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback
}

export function parseModelJson(text) {
  const clean = String(text || '').replace(/```(?:json)?|```/gi, '').trim()
  const start = clean.indexOf('{')
  const end = clean.lastIndexOf('}')

  if (start === -1 || end <= start) {
    throw new Error('A IA não retornou um objeto JSON válido')
  }

  return JSON.parse(clean.slice(start, end + 1))
}

export function sanitizeQuote(raw, fallbackSupplier = '') {
  const items = Array.isArray(raw?.items)
    ? raw.items.slice(0, 500).map((item) => ({
        item_name: cleanText(item?.item_name, 'Item sem nome'),
        quantity: toNonNegativeNumber(item?.quantity, 1),
        unit: cleanText(item?.unit, 'un').slice(0, 20),
        unit_price: toNonNegativeNumber(item?.unit_price, 0),
        total_price: toNonNegativeNumber(item?.total_price, 0),
      })).filter((item) => item.item_name)
    : []

  return {
    supplier: cleanText(raw?.supplier, fallbackSupplier),
    items,
  }
}

export function sanitizeQuotesInput(rawQuotes) {
  if (!Array.isArray(rawQuotes) || rawQuotes.length < 1 || rawQuotes.length > 20) {
    throw new Error('Envie entre 1 e 20 orçamentos')
  }

  let itemCount = 0
  const quotes = rawQuotes.map((quote, index) => {
    const sanitized = sanitizeQuote(quote, `Fornecedor ${index + 1}`)
    itemCount += sanitized.items.length

    return {
      id: cleanText(quote?.id, `quote-${index + 1}`),
      fileName: cleanText(quote?.fileName, `orcamento-${index + 1}.pdf`),
      supplier: sanitized.supplier,
      manual: Boolean(quote?.manual),
      items: sanitized.items,
    }
  })

  if (itemCount > 1000) {
    throw new Error('O limite é de 1.000 itens por comparação')
  }

  return quotes
}

export function sanitizeGroups(rawGroups, validSourceIds, { allowEmpty = false } = {}) {
  if (!Array.isArray(rawGroups)) return []

  return rawGroups.slice(0, 1000).map((group, index) => ({
    id: cleanText(group?.id, `group-${index + 1}`),
    normalized_name: cleanText(group?.normalized_name, 'Item sem nome'),
    unit: cleanText(group?.unit, 'un').slice(0, 20),
    quantity: toNonNegativeNumber(group?.quantity, group?.items?.[0]?.quantity || 1),
    notes: cleanText(group?.notes),
    items: Array.isArray(group?.items)
      ? group.items.map((item) => ({
          source_id: cleanText(item?.source_id),
          source: cleanText(item?.source),
          unit_price: toNonNegativeNumber(item?.unit_price, 0),
          quantity: toNonNegativeNumber(item?.quantity, group?.quantity || 1),
          total_price: toNonNegativeNumber(item?.total_price, 0),
        })).filter((item) => validSourceIds.has(item.source_id) && item.unit_price > 0)
      : [],
  })).filter((group) => group.normalized_name && (allowEmpty || group.items.length))
}
