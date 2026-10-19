import { http, HttpResponse, delay } from 'msw'
import { mockDB } from '../db'
import { extractAuthUser, requireAuth, handleScenarioOverride } from './helper'
import { CategoryType, SortOption, StatusFilter } from '@/types'

export const nftHandlers = [
  // GET /api/nfts
  http.get('/api/nfts', async ({ request }) => {
    const override = handleScenarioOverride(request)
    if (override) return override

    const scenario = mockDB.getScenario()
    if (scenario === 'slow_network') {
      await delay(1200)
    }

    const url = new URL(request.url)
    const search = url.searchParams.get('search') || undefined
    const category = (url.searchParams.get('category') as CategoryType) || undefined
    const minPrice = url.searchParams.get('minPrice') || undefined
    const maxPrice = url.searchParams.get('maxPrice') || undefined
    const status = (url.searchParams.get('status') as StatusFilter) || undefined
    const sort = (url.searchParams.get('sort') as SortOption) || undefined
    const page = parseInt(url.searchParams.get('page') || '1', 10)
    const limit = parseInt(url.searchParams.get('limit') || '6', 10)

    const currentUser = extractAuthUser(request)

    const result = mockDB.getNFTs(
      { search, category, minPrice, maxPrice, status, sort, page, limit },
      currentUser?.id
    )

    return HttpResponse.json(result)
  }),

  // GET /api/nfts/:id
  http.get('/api/nfts/:id', async ({ request, params }) => {
    const override = handleScenarioOverride(request)
    if (override) return override

    const { id } = params as { id: string }
    const currentUser = extractAuthUser(request)

    const nft = mockDB.getNFTById(id, currentUser?.id)
    if (!nft) {
      return HttpResponse.json(
        { message: `NFT com id "${id}" não foi encontrado.`, code: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    return HttpResponse.json(nft)
  }),

  // GET /api/favorites
  http.get('/api/favorites', ({ request }) => {
    const override = handleScenarioOverride(request)
    if (override) return override

    const { errorResponse, user } = requireAuth(request)
    if (errorResponse) return errorResponse

    const favorites = mockDB.getFavorites(user.id)
    return HttpResponse.json({ items: favorites, total: favorites.length })
  }),

  // POST /api/favorites/:id
  http.post('/api/favorites/:id', async ({ request, params }) => {
    const override = handleScenarioOverride(request)
    if (override) return override

    const scenario = mockDB.getScenario()
    if (scenario === 'favorite_fail') {
      return HttpResponse.json(
        { message: 'Falha simulada ao salvar favorito.', code: 'FAVORITE_ERROR' },
        { status: 500 }
      )
    }

    const { errorResponse, user } = requireAuth(request)
    if (errorResponse) return errorResponse

    const { id } = params as { id: string }
    const nft = mockDB.getNFTById(id)
    if (!nft) {
      return HttpResponse.json(
        { message: 'NFT não encontrado.', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    const res = mockDB.toggleFavorite(user.id, id)
    return HttpResponse.json({
      success: true,
      isLiked: res.isLiked,
      likes: res.likes,
      nftId: id,
    })
  }),

  // DELETE /api/favorites/:id
  http.delete('/api/favorites/:id', ({ request, params }) => {
    const override = handleScenarioOverride(request)
    if (override) return override

    const { errorResponse, user } = requireAuth(request)
    if (errorResponse) return errorResponse

    const { id } = params as { id: string }
    const res = mockDB.toggleFavorite(user.id, id)
    return HttpResponse.json({
      success: true,
      isLiked: res.isLiked,
      likes: res.likes,
      nftId: id,
    })
  }),
]
