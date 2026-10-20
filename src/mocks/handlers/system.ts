import { http, HttpResponse } from 'msw'
import { mockDB } from '../db'
import { broadcastNFTUpdate, broadcastOrderUpdate } from '../socketBinding'
import { requireAuth } from './helper'

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
    const updated = mockDB.updateNFT(nftId, {
      ...(price !== undefined ? { price } : {}),
      ...(availableSupply !== undefined ? { availableSupply } : {}),
    })

    if (!updated) {
      return HttpResponse.json({ message: 'NFT não encontrado', code: 'NOT_FOUND' }, { status: 404 })
    }

    // Broadcast Socket.IO event
    broadcastNFTUpdate({
      id: `evt-${crypto.randomUUID()}`,
      version: updated.version,
      nftId: updated.id,
      price: updated.price,
      availableSupply: updated.availableSupply,
      isSoldOut: updated.isSoldOut,
      updatedAt: updated.updatedAt,
    })

    return HttpResponse.json({ success: true, nft: updated })
  }),

  // Complete or reject a committed pending order through the Socket.IO mock.
  http.post('/api/system/trigger-order-update', async ({ request }) => {
    const { errorResponse, user } = requireAuth(request)
    if (errorResponse) return errorResponse
    const body = (await request.json()) as { orderId: string; status: 'confirmed' | 'failed' }
    if (!body.orderId || !['confirmed', 'failed'].includes(body.status)) {
      return HttpResponse.json({ message: 'Atualização de pedido inválida.', code: 'INVALID_ORDER_UPDATE' }, { status: 400 })
    }

    const order = mockDB.getOrderById(body.orderId)
    if (!order || order.userId !== user.id) {
      return HttpResponse.json({ message: 'Pedido não encontrado.', code: 'ORDER_NOT_FOUND' }, { status: 404 })
    }
    const updated = mockDB.updateOrderStatus(order.orderId, body.status)
    if (!updated) {
      return HttpResponse.json({ message: 'O pedido já atingiu um estado terminal.', code: 'ORDER_TERMINAL' }, { status: 409 })
    }

    broadcastOrderUpdate({
      id: `evt-${crypto.randomUUID()}`,
      version: updated.version,
      orderId: updated.orderId,
      userId: updated.userId,
      status: updated.status,
      txHash: updated.txHash,
      updatedAt: updated.updatedAt || new Date().toISOString(),
    })
    return HttpResponse.json({ success: true, order: updated })
  }),

  // Replay deterministic events to verify duplicate and out-of-order guards.
  http.post('/api/system/replay-order-event', async ({ request }) => {
    const { errorResponse, user } = requireAuth(request)
    if (errorResponse) return errorResponse
    const body = (await request.json()) as {
      orderId: string
      version: number
      eventId: string
      duplicate?: boolean
    }
    const order = mockDB.getOrderById(body.orderId)
    if (!order || order.userId !== user.id) {
      return HttpResponse.json({ message: 'Pedido não encontrado.', code: 'ORDER_NOT_FOUND' }, { status: 404 })
    }
    if (!Number.isInteger(body.version) || body.version < 1 || !body.eventId) {
      return HttpResponse.json({ message: 'Evento inválido.', code: 'INVALID_EVENT' }, { status: 400 })
    }
    const event = {
      id: body.eventId,
      version: body.version,
      orderId: order.orderId,
      userId: order.userId,
      status: order.status,
      txHash: order.txHash,
      updatedAt: order.updatedAt || order.createdAt,
    }
    broadcastOrderUpdate(event)
    if (body.duplicate) broadcastOrderUpdate(event)
    return HttpResponse.json({ success: true, event })
  }),
]
