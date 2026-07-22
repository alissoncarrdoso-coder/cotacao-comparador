import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request) {
  try {
    const { quotes } = await request.json()

    const allItems = quotes.flatMap(q =>
      q.items.map(item => ({
        ...item,
        source: q.supplier || q.fileName
      }))
    )

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 3000,
      messages: [
        {
          role: 'user',
          content: `Você recebeu itens de ${quotes.length} orçamentos diferentes de materiais elétricos, hidráulicos ou de construção.

ITENS:
${JSON.stringify(allItems, null, 2)}

Agrupe itens que representam o mesmo produto, mesmo com nomes ligeiramente diferentes.
Exemplos: "Cabo 2,5mm" = "Fio 2,5mm²" | "Registro de gaveta 3/4" = "Válvula gaveta 3/4"

Para cada grupo retorne:
- normalized_name: nome padronizado mais descritivo
- unit: unidade de medida padronizada
- items: array com cada cotação disponível, contendo: source, unit_price, quantity, total_price

Retorne SOMENTE JSON válido:
{"groups": [{"normalized_name": "...", "unit": "un", "items": [{"source": "...", "unit_price": 0.00, "quantity": 1, "total_price": 0.00}]}]}`
        }
      ]
    })

    const text = response.content.find(c => c.type === 'text')?.text || '{}'
    const clean = text.replace(/```json\n?|\n?```/g, '').trim()
    const parsed = JSON.parse(clean)

    return NextResponse.json({ groups: parsed.groups || [] })
  } catch (err) {
    console.error('Erro ao normalizar itens:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
