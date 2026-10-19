import { http, HttpResponse } from 'msw'
import { mockDB } from '../db'
import { handleScenarioOverride } from './helper'

export const quoteHandlers = [
  // POST /api/quote
  http.post('/api/quote', async ({ request }) => {
    const override = handleScenarioOverride(request)
    if (override) return override

    const body = (await request.json()) as {
      items: Array<{ nftId: string; quantity: number }>
      couponCode?: string
    }

    if (!body.items || !Array.isArray(body.items)) {
      return HttpResponse.json(
        { message: 'Lista de itens do pedido inválida.', code: 'INVALID_REQUEST' },
        { status: 400 }
      )
    }

    const quote = mockDB.generateQuote(body.items, body.couponCode)
    return HttpResponse.json(quote)
  }),

  // POST /api/coupons/validate
  http.post('/api/coupons/validate', async ({ request }) => {
    const override = handleScenarioOverride(request)
    if (override) return override

    const body = (await request.json()) as { code: string }
    if (!body.code || !body.code.trim()) {
      return HttpResponse.json(
        { message: 'Código de cupom não informado.', code: 'EMPTY_CODE' },
        { status: 400 }
      )
    }

    const coupon = mockDB.validateCoupon(body.code)
    if (!coupon) {
      return HttpResponse.json(
        { message: 'Cupom de desconto inválido ou inexistente.', code: 'COUPON_NOT_FOUND', valid: false },
        { status: 404 }
      )
    }

    if (!coupon.valid) {
      return HttpResponse.json(
        { message: 'Este cupom de desconto expirou.', code: 'COUPON_EXPIRED', valid: false },
        { status: 400 }
      )
    }

    return HttpResponse.json({
      valid: true,
      coupon,
      message: `Cupom aplicado! ${coupon.discountPercent}% de desconto.`,
    })
  }),
]
