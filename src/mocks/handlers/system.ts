import { http, HttpResponse } from 'msw'
import { mockDB } from '../db'
import { broadcastNFTUpdate } from '../socketBinding'

export const systemHandlers = [
  // POST /api/system/reset
  http.post('/api/system/reset', () => {
    mockDB.reset()
    return HttpResponse.json({ success: true, message: 'Estado simulado restaurado para o padrão inicial.' })
  }),

  // GET /api/system/scenario
  http.get('/api/system/scenario', () => {
    return HttpResponse.json({ activeScenario: mockDB.getScenario() || 'default' })
  }),

  // POST /api/system/scenario
  http.post('/api/system/scenario', async ({ request }) => {
    const body = (await request.json()) as { scenario: string | null }
    mockDB.setScenario(body.scenario === 'default' ? null : body.scenario)
    return HttpResponse.json({ success: true, scenario: mockDB.getScenario() || 'default' })
  }),

  // POST /api/system/trigger-nft-update
  http.post('/api/system/trigger-nft-update', async ({ request }) => {
    const body = (await request.json()) as {
      nftId: string
      price?: string
      availableSupply?: number
    }

    const { nftId, price, availableSupply } = body
    const updated = mockDB.updateNFT(nftId, { price, availableSupply })

    if (!updated) {
      return HttpResponse.json({ message: 'NFT não encontrado', code: 'NOT_FOUND' }, { status: 404 })
    }

    // Broadcast Socket.IO event
    broadcastNFTUpdate({
      id: `evt-${Date.now()}`,
      version: updated.version,
      nftId: updated.id,
      price: updated.price,
      availableSupply: updated.availableSupply,
      isSoldOut: updated.isSoldOut,
      updatedAt: updated.updatedAt,
    })

    return HttpResponse.json({ success: true, nft: updated })
  }),
]
