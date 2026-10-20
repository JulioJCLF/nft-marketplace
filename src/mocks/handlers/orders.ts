import { http, HttpResponse, delay } from 'msw'
import { mockDB } from '../db'
import { requireAuth, handleScenarioOverride } from './helper'
import { CreateOrderPayload } from '@/types'

export const orderHandlers = [
  // POST /api/orders
  http.post('/api/orders', async ({ request }) => {
    const override = handleScenarioOverride(request)
    if (override) return override

    const { errorResponse, user } = requireAuth(request)
    if (errorResponse) return errorResponse

    const payload = (await request.json()) as CreateOrderPayload
    const { idempotencyKey, items, walletAddress, network } = payload

    if (!idempotencyKey) {
      return HttpResponse.json(
        { message: 'Chave de idempotência (idempotencyKey) é obrigatória para criar pedidos.', code: 'MISSING_IDEMPOTENCY_KEY' },
        { status: 400 }
      )
    }

    if (!items || !items.length) {
      return HttpResponse.json(
        { message: 'O pedido deve conter pelo menos um item.', code: 'EMPTY_ORDER' },
        { status: 400 }
      )
    }

    if (!walletAddress || !network) {
      return HttpResponse.json(
        { message: 'Endereço da carteira e rede blockchain são obrigatórios.', code: 'MISSING_PAYMENT_DETAILS' },
        { status: 400 }
      )
    }

    const scenario = mockDB.getScenario()
    if (scenario === 'payment_failed' || payload.simulateFailure) {
      return HttpResponse.json(
        { message: 'Transação recusada pela carteira ou saldo insuficiente para cobrir gás e total.', code: 'PAYMENT_REJECTED' },
        { status: 402 }
      )
    }

    if (scenario === 'order_timeout') {
      // Model a lost response after the server has committed the order. A retry with the
      // same key must recover this exact receipt instead of charging/deducting twice.
      const result = mockDB.createOrder(user.id, payload)
      if (result.conflict) {
        return HttpResponse.json(
          { message: 'Conflito de idempotência: Esta chave já foi utilizada com dados de pedido divergentes.', code: 'IDEMPOTENCY_CONFLICT' },
          { status: 409 }
        )
      }
      if (result.status === 'existing') return HttpResponse.json(result.order, { status: 200 })
      await delay(8000)
      return HttpResponse.json(
        { message: 'Timeout simulado durante o processamento do pedido.', code: 'GATEWAY_TIMEOUT' },
        { status: 504 }
      )
    }

    try {
      const result = mockDB.createOrder(user.id, payload)

      if (result.conflict) {
        return HttpResponse.json(
          {
            message: 'Conflito de idempotência: Esta chave já foi utilizada com dados de pedido divergentes.',
            code: 'IDEMPOTENCY_CONFLICT',
          },
          { status: 409 }
        )
      }

      // If it was already created with this idempotency key, return existing order
      if (result.status === 'existing') {
        return HttpResponse.json(result.order, { status: 200 })
      }

      return HttpResponse.json(result.order, { status: 201 })
    } catch (err) {
      return HttpResponse.json(
        { message: (err as Error).message || 'Falha ao processar pedido.', code: 'ORDER_ERROR' },
        { status: 400 }
      )
    }
  }),

  // GET /api/orders/by-idempotency/:key — recover a response lost after server commit
  http.get('/api/orders/by-idempotency/:key', ({ request, params }) => {
    const { errorResponse, user } = requireAuth(request)
    if (errorResponse) return errorResponse

    const { key } = params as { key: string }
    const order = mockDB.getOrderByIdempotencyKey(user.id, key)
    if (!order) {
      return HttpResponse.json(
        { message: 'Nenhum pedido encontrado para esta tentativa.', code: 'ORDER_NOT_FOUND' },
        { status: 404 }
      )
    }
    return HttpResponse.json(order)
  }),

  // GET /api/orders/:id
  http.get('/api/orders/:id', ({ request, params }) => {
    const override = handleScenarioOverride(request)
    if (override) return override

    const { errorResponse, user } = requireAuth(request)
    if (errorResponse) return errorResponse

    const { id } = params as { id: string }
    const order = mockDB.getOrderById(id)

    if (!order) {
      return HttpResponse.json(
        { message: 'Pedido não encontrado.', code: 'ORDER_NOT_FOUND' },
        { status: 404 }
      )
    }

    // Security check: only order owner can view their order
    if (order.userId !== user.id) {
      return HttpResponse.json(
        { message: 'Acesso não autorizado a este pedido.', code: 'FORBIDDEN' },
        { status: 403 }
      )
    }

    return HttpResponse.json(order)
  }),

  // GET /api/orders
  http.get('/api/orders', ({ request }) => {
    const override = handleScenarioOverride(request)
    if (override) return override

    const { errorResponse, user } = requireAuth(request)
    if (errorResponse) return errorResponse

    const userOrders = mockDB.getOrdersByUser(user.id)
    return HttpResponse.json({ items: userOrders, total: userOrders.length })
  }),
]
