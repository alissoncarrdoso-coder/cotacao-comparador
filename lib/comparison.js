export function getSuppliers(comparison) {
  return (comparison?.quotes || []).map((quote) => ({
    id: quote.id,
    name: quote.supplier || quote.fileName,
    manual: Boolean(quote.manual),
  }))
}

export function getBestQuote(group, suppliers) {
  const pricesBySupplier = new Map()
  ;(group.items || []).forEach((item) => {
    if (Number.isFinite(item.unit_price) && item.unit_price > 0) {
      pricesBySupplier.set(item.source_id, item.unit_price)
    }
  })

  const available = suppliers
    .map((supplier) => ({ supplier, price: pricesBySupplier.get(supplier.id) }))
    .filter(({ price }) => Number.isFinite(price))

  if (!available.length) {
    return { best: null, worst: null, bestSupplierId: null, pricesBySupplier }
  }

  const best = Math.min(...available.map(({ price }) => price))
  const worst = Math.max(...available.map(({ price }) => price))
  const bestSupplierId = available.find(({ price }) => price === best)?.supplier.id || null

  return { best, worst, bestSupplierId, pricesBySupplier }
}

export function sortGroups(groups, suppliers, sortBy, sortDir) {
  return [...(groups || [])].sort((a, b) => {
    let first
    let second

    if (sortBy === 'economy') {
      const quoteA = getBestQuote(a, suppliers)
      const quoteB = getBestQuote(b, suppliers)
      first = quoteA.best === null ? 0 : quoteA.worst - quoteA.best
      second = quoteB.best === null ? 0 : quoteB.worst - quoteB.best
    } else {
      first = a.normalized_name.toLocaleLowerCase('pt-BR')
      second = b.normalized_name.toLocaleLowerCase('pt-BR')
    }

    return first < second
      ? (sortDir === 'asc' ? -1 : 1)
      : first > second
        ? (sortDir === 'asc' ? 1 : -1)
        : 0
  })
}

function csvCell(value) {
  let text = String(value ?? '')
  if (/^[=+@]/.test(text) || /^-\D/.test(text)) text = `'${text}`
  return `"${text.replace(/"/g, '""')}"`
}

export function createComparisonCsv(comparison, groups) {
  const suppliers = getSuppliers(comparison)
  const header = [
    'Item',
    'Unidade',
    'Quantidade',
    ...suppliers.map((supplier) => supplier.name),
    'Melhor preço (fornecedor)',
    'Economia unitária',
    'Observações',
  ]

  const rows = [header]

  groups.forEach((group) => {
    const { best, worst, bestSupplierId, pricesBySupplier } = getBestQuote(group, suppliers)
    const bestSupplier = suppliers.find((supplier) => supplier.id === bestSupplierId)
    rows.push([
      group.normalized_name,
      group.unit,
      Number(group.quantity || 1).toLocaleString('pt-BR'),
      ...suppliers.map((supplier) => {
        const price = pricesBySupplier.get(supplier.id)
        return Number.isFinite(price) ? price.toFixed(2).replace('.', ',') : '-'
      }),
      bestSupplier?.name || '',
      best === null || worst === null ? '' : (worst - best).toFixed(2).replace('.', ','),
      group.notes || '',
    ])
  })

  return rows.map((row) => row.map(csvCell).join(';')).join('\r\n')
}

function normalizedText(value) {
  const aliases = {
    flex: 'flexivel',
    flexiveis: 'flexivel',
    metros: 'm',
    metro: 'm',
    milimetros: 'mm',
    milimetro: 'mm',
    centimetros: 'cm',
    centimetro: 'cm',
    quilogramas: 'kg',
    quilograma: 'kg',
    quilos: 'kg',
    quilo: 'kg',
    litros: 'l',
    litro: 'l',
    unidades: 'un',
    unidade: 'un',
    und: 'un',
    pecas: 'un',
    peca: 'un',
  }

  const prepared = String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/(\d)[,.](\d)/g, '$1_$2')
    .replace(/([a-z])(\d)/g, '$1 $2')
    .replace(/(\d)([a-z])/g, '$1 $2')
    .replace(/[^a-z0-9_]+/g, ' ')
    .trim()

  return prepared
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => aliases[token] || token)
    .filter((token) => !['produto', 'servico'].includes(token))
    .join(' ')
}

function normalizeUnit(value) {
  const unit = normalizedText(value)
  const aliases = {
    unidade: 'un', unidades: 'un', und: 'un', un: 'un', peca: 'un', pecas: 'un',
    metro: 'm', metros: 'm', m: 'm',
    quilo: 'kg', quilos: 'kg', kilogramas: 'kg', kg: 'kg',
    litro: 'l', litros: 'l', l: 'l',
    caixa: 'cx', caixas: 'cx', cx: 'cx',
    pacote: 'pct', pacotes: 'pct', pct: 'pct',
    rolo: 'rl', rolos: 'rl', rl: 'rl',
  }
  return aliases[unit] || unit || 'un'
}

function tokens(value) {
  return new Set(normalizedText(value).split(' ').filter((token) => token.length > 1))
}

function numericTokens(value) {
  return normalizedText(value).match(/\d+(?:_\d+)?/g) || []
}

function jaccard(first, second) {
  if (!first.size || !second.size) return 0
  let intersection = 0
  first.forEach((token) => {
    if (second.has(token)) intersection += 1
  })
  return intersection / new Set([...first, ...second]).size
}

function productSimilarity(first, second) {
  const firstText = normalizedText(first)
  const secondText = normalizedText(second)
  if (!firstText || !secondText) return 0
  if (firstText === secondText) return 1

  const firstNumbers = numericTokens(firstText)
  const secondNumbers = numericTokens(secondText)
  if (firstNumbers.length && secondNumbers.length) {
    const sameNumbers = firstNumbers.every((number) => secondNumbers.includes(number))
      && secondNumbers.every((number) => firstNumbers.includes(number))
    if (!sameNumbers) return 0
  }

  const tokenScore = jaccard(tokens(firstText), tokens(secondText))
  const containment = firstText.includes(secondText) || secondText.includes(firstText) ? 1 : 0
  return (tokenScore * 0.8) + (containment * 0.2)
}

function makeGroup(item, quote) {
  return {
    id: crypto.randomUUID(),
    normalized_name: item.item_name,
    unit: item.unit || 'un',
    quantity: Number(item.quantity || 1),
    notes: '',
    items: [{
      source_id: quote.id,
      source: quote.supplier || quote.fileName,
      unit_price: Number(item.unit_price || 0),
      quantity: Number(item.quantity || 1),
      total_price: Number(item.total_price || 0),
    }],
  }
}

export function buildLocalGroups(quotes, { threshold = 0.64 } = {}) {
  const groups = []
  let consideredMatches = 0
  let confidentMatches = 0
  let uncertainMatches = 0

  ;(quotes || []).forEach((quote, quoteIndex) => {
    ;(quote.items || []).forEach((item) => {
      let bestGroup = null
      let bestScore = 0

      groups.forEach((group) => {
        if ((group.items || []).some((entry) => entry.source_id === quote.id)) return
        if (normalizeUnit(group.unit) !== normalizeUnit(item.unit)) return

        const score = productSimilarity(group.normalized_name, item.item_name)
        if (score > bestScore) {
          bestScore = score
          bestGroup = group
        }
      })

      if (quoteIndex > 0) consideredMatches += 1

      if (bestGroup && bestScore >= threshold) {
        bestGroup.items.push({
          source_id: quote.id,
          source: quote.supplier || quote.fileName,
          unit_price: Number(item.unit_price || 0),
          quantity: Number(item.quantity || 1),
          total_price: Number(item.total_price || 0),
        })
        if (item.item_name.length > bestGroup.normalized_name.length && bestScore > 0.82) {
          bestGroup.normalized_name = item.item_name
        }
        confidentMatches += 1
      } else {
        if (quoteIndex > 0 && bestScore >= 0.45) uncertainMatches += 1
        groups.push(makeGroup(item, quote))
      }
    })
  })

  const confidence = consideredMatches
    ? Math.max(0, Math.min(1, (confidentMatches - (uncertainMatches * 0.35)) / consideredMatches))
    : 1

  return {
    groups,
    confidence,
    uncertainCount: uncertainMatches,
    matchedCount: confidentMatches,
  }
}

export function mergeQuoteIntoComparison(comparison, quote) {
  const nextQuote = {
    ...quote,
    id: quote.id || crypto.randomUUID(),
  }
  const next = {
    ...comparison,
    quotes: [...(comparison.quotes || []), nextQuote],
    groups: (comparison.groups || []).map((group) => ({
      ...group,
      items: [...(group.items || [])],
    })),
  }

  ;(nextQuote.items || []).forEach((item) => {
    let bestGroup = null
    let bestScore = 0

    next.groups.forEach((group) => {
      if (normalizeUnit(group.unit) !== normalizeUnit(item.unit)) return
      const score = productSimilarity(group.normalized_name, item.item_name)
      if (score > bestScore) {
        bestGroup = group
        bestScore = score
      }
    })

    if (bestGroup && bestScore >= 0.64) {
      bestGroup.items.push({
        source_id: nextQuote.id,
        source: nextQuote.supplier || nextQuote.fileName,
        unit_price: Number(item.unit_price || 0),
        quantity: Number(item.quantity || 1),
        total_price: Number(item.total_price || 0),
      })
    } else {
      next.groups.push(makeGroup(item, nextQuote))
    }
  })

  return next
}
