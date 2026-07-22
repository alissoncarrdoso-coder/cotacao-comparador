export function getSuppliers(comparison) {
  return comparison.quotes.map((quote) => ({
    id: quote.id,
    name: quote.supplier || quote.fileName,
  }))
}

export function getBestQuote(group, suppliers) {
  const pricesBySupplier = new Map()
  group.items.forEach((item) => {
    if (Number.isFinite(item.unit_price)) pricesBySupplier.set(item.source_id, item.unit_price)
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
  return [...groups].sort((a, b) => {
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
    ...suppliers.map((supplier) => supplier.name),
    'Melhor preço (fornecedor)',
    'Economia',
  ]

  const rows = [header]

  groups.forEach((group) => {
    const { best, worst, bestSupplierId, pricesBySupplier } = getBestQuote(group, suppliers)
    if (best === null) return

    const bestSupplier = suppliers.find((supplier) => supplier.id === bestSupplierId)
    rows.push([
      group.normalized_name,
      group.unit,
      ...suppliers.map((supplier) => {
        const price = pricesBySupplier.get(supplier.id)
        return Number.isFinite(price) ? price.toFixed(2).replace('.', ',') : '-'
      }),
      bestSupplier?.name || '',
      (worst - best).toFixed(2).replace('.', ','),
    ])
  })

  return rows.map((row) => row.map(csvCell).join(';')).join('\r\n')
}
