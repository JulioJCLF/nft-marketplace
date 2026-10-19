import { http, HttpResponse } from 'msw'
import { mockDB } from '../db'
import { extractAuthUser, handleScenarioOverride } from './helper'
import { CartItem } from '@/types'

export const cartHandlers = [
  // GET /api/cart
  http.get('/api/cart', ({ request }) => {
    const override = handleScenarioOverride(request)
    if (override) return override

    const user = extractAuthUser(request)
    const items = mockDB.getCart(user?.id)
    return HttpResponse.json({ items })
  }),

  // POST /api/cart (save entire cart)
  http.post('/api/cart', async ({ request }) => {
    const override = handleScenarioOverride(request)
    if (override) return override

    const body = (await request.json()) as { items: CartItem[] }
    const user = extractAuthUser(request)
    mockDB.saveCart(body.items || [], user?.id)
    return HttpResponse.json({ success: true, items: body.items })
  }),

  // POST /api/cart/items (add item)
  http.post('/api/cart/items', async ({ request }) => {
    const override = handleScenarioOverride(request)
    if (override) return override

    const body = (await request.json()) as { nftId: string; quantity?: number }
    const { nftId, quantity = 1 } = body

    const nft = mockDB.getNFTById(nftId)
    if (!nft) {
      return HttpResponse.json(
        { message: 'NFT não encontrado para adicionar ao carrinho.', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    if (nft.isSoldOut || nft.availableSupply < quantity) {
      return HttpResponse.json(
        { message: 'Este NFT está esgotado ou quantidade solicitada excede o estoque.', code: 'OUT_OF_STOCK' },
        { status: 400 }
      )
    }

    const user = extractAuthUser(request)
    const currentCart = mockDB.getCart(user?.id)
    const existingIndex = currentCart.findIndex((i) => i.nftId === nftId)

    if (existingIndex > -1) {
      const newQty = currentCart[existingIndex].quantity + quantity
      if (newQty > nft.availableSupply) {
        return HttpResponse.json(
          { message: `Limite de estoque atingido (${nft.availableSupply} disponíveis).`, code: 'STOCK_LIMIT' },
          { status: 400 }
        )
      }
      currentCart[existingIndex].quantity = newQty
    } else {
      currentCart.push({
        nftId: nft.id,
        nft,
        quantity,
        unitPrice: nft.price,
      })
    }

    mockDB.saveCart(currentCart, user?.id)
    return HttpResponse.json({ success: true, items: currentCart })
  }),

  // PUT /api/cart/items/:id (update quantity)
  http.put('/api/cart/items/:id', async ({ request, params }) => {
    const override = handleScenarioOverride(request)
    if (override) return override

    const { id } = params as { id: string }
    const body = (await request.json()) as { quantity: number }
    const quantity = Math.floor(body.quantity)

    const user = extractAuthUser(request)
    const currentCart = mockDB.getCart(user?.id)
    const itemIndex = currentCart.findIndex((i) => i.nftId === id)

    if (itemIndex === -1) {
      return HttpResponse.json(
        { message: 'Item não encontrado no carrinho.', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    if (quantity <= 0) {
      currentCart.splice(itemIndex, 1)
    } else {
      const nft = mockDB.getNFTById(id)
      if (nft && quantity > nft.availableSupply) {
        return HttpResponse.json(
          { message: `Quantidade máxima disponível é ${nft.availableSupply}.`, code: 'STOCK_EXCEEDED' },
          { status: 400 }
        )
      }
      currentCart[itemIndex].quantity = quantity
    }

    mockDB.saveCart(currentCart, user?.id)
    return HttpResponse.json({ success: true, items: currentCart })
  }),

  // DELETE /api/cart/items/:id (remove item)
  http.delete('/api/cart/items/:id', ({ request, params }) => {
    const override = handleScenarioOverride(request)
    if (override) return override

    const { id } = params as { id: string }
    const user = extractAuthUser(request)
    const currentCart = mockDB.getCart(user?.id)
    const filtered = currentCart.filter((i) => i.nftId !== id)

    mockDB.saveCart(filtered, user?.id)
    return HttpResponse.json({ success: true, items: filtered })
  }),
]
