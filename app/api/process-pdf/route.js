import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const base64 = buffer.toString('base64')

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'document',
              source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: base64
              }
            },
            {
              type: 'text',
              text: `Extraia TODOS os itens/produtos listados neste orçamento.

Para cada item retorne:
- item_name: nome completo do produto ou serviço
- quantity: quantidade (número, use 1 se não informado)
- unit: unidade de medida (un, m, kg, L, m², etc)
- unit_price: preço unitário como número decimal (ex: 12.50)
- total_price: preço total da linha como número decimal

Se o orçamento tiver cabeçalho com nome do fornecedor, inclua no campo "supplier".

Retorne SOMENTE JSON válido, sem markdown, sem explicações:
{"supplier": "Nome do fornecedor ou vazio", "items": [{"item_name": "...", "quantity": 1, "unit": "un", "unit_price": 0.00, "total_price": 0.00}]}`
            }
          ]
        }
      ]
    })

    const text = response.content.find(c => c.type === 'text')?.text || '{}'
    const clean = text.replace(/```json\n?|\n?```/g, '').trim()
    const parsed = JSON.parse(clean)

    return NextResponse.json({
      fileName: file.name,
      supplier: parsed.supplier || file.name.replace('.pdf', ''),
      items: parsed.items || []
    })
  } catch (err) {
    console.error('Erro ao processar PDF:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export const config = {
  api: { bodyParser: false }
}
