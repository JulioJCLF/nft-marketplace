import {
  NFT,
  User,
  Wallet,
  CartItem,
  OrderReceipt,
  Coupon,
  CatalogSearchParams,
  CatalogResponse,
  OrderQuote,
  QuoteItem,
  CreateOrderPayload,
} from '@/types'
import {
  INITIAL_NFTS,
  INITIAL_USERS,
  INITIAL_WALLETS,
  INITIAL_FAVORITES,
  INITIAL_COUPONS,
} from './fixtures'
import { mulEth, calcDiscountPercent, calcOrderTotal, toDecimal } from '@/lib/eth'

interface MockDBState {
  nfts: NFT[]
  users: Array<User & { passwordHash: string }>
  wallets: Wallet[]
  favorites: Record<string, string[]> // userId -> nftIds[]
  carts: Record<string, CartItem[]> // userId -> CartItem[]
  guestCart: CartItem[]
  orders: OrderReceipt[]
  ordersByIdempotency: Record<string, { order: OrderReceipt; payloadHash: string }>
  coupons: Coupon[]
  activeScenario: string | null
}

const STORAGE_KEY = 'nft_mock_db_v2'

function hashPayload(payload: unknown): string {
  return JSON.stringify(payload)
}

class MockDatabase {
  private state: MockDBState

  constructor() {
    this.state = this.loadState()
  }

  private loadState(): MockDBState {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const state = JSON.parse(saved) as MockDBState
        const fixtureById = new Map(INITIAL_NFTS.map((nft) => [nft.id, nft]))
        let enrichedNFTMetadata = false

        state.nfts = state.nfts.map((nft) => {
          const fixture = fixtureById.get(nft.id)
          if (!fixture) return nft

          const hasDemoReviews = nft.id === fixture.id && fixture.reviews?.some((review) => review.isMock)
          const rating = hasDemoReviews ? fixture.rating : (nft.rating ?? fixture.rating)
          const reviewCount = hasDemoReviews ? fixture.reviewCount : (nft.reviewCount ?? fixture.reviewCount)
          const reviews = nft.reviews ?? fixture.reviews
          if (rating === nft.rating && reviewCount === nft.reviewCount && reviews === nft.reviews) return nft

          enrichedNFTMetadata = true
          return { ...nft, rating, reviewCount, reviews }
        })

        // Upgrade newly introduced display metadata without resetting user data or mock state.
        if (enrichedNFTMetadata) localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
        return state
      }
    } catch {
      // ignore
    }
    return this.getInitialState()
  }

  private getInitialState(): MockDBState {
    return {
      nfts: JSON.parse(JSON.stringify(INITIAL_NFTS)),
      users: JSON.parse(JSON.stringify(INITIAL_USERS)),
      wallets: JSON.parse(JSON.stringify(INITIAL_WALLETS)),
      favorites: JSON.parse(JSON.stringify(INITIAL_FAVORITES)),
      carts: {
        'user-alice-01': [
          {
            nftId: 'bored-ape-7090',
            nft: INITIAL_NFTS[0],
            quantity: 1,
            unitPrice: INITIAL_NFTS[0].price,
          },
        ],
      },
      guestCart: [],
      orders: [],
      ordersByIdempotency: {},
      coupons: JSON.parse(JSON.stringify(INITIAL_COUPONS)),
      activeScenario: null,
    }
  }

  private persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state))
    } catch {
      // ignore
    }
  }

  public reset() {
    this.state = this.getInitialState()
    this.persist()
    localStorage.removeItem('nft_active_scenario')
  }

  // Scenarios
  public setScenario(scenario: string | null) {
    this.state.activeScenario = scenario
    if (scenario) {
      localStorage.setItem('nft_active_scenario', scenario)
    } else {
      localStorage.removeItem('nft_active_scenario')
    }
    this.persist()
  }

  public getScenario(): string | null {
    return this.state.activeScenario || localStorage.getItem('nft_active_scenario')
  }

  // NFTs Catalog
  public getNFTs(params: CatalogSearchParams, currentUserId?: string): CatalogResponse {
    const availableNFTs = this.state.nfts.filter((nft) => !nft.isSoldOut && nft.availableSupply > 0)
    const maxAvailablePrice = availableNFTs.reduce((max, nft) => {
      const price = toDecimal(nft.price)
      return price.greaterThan(max) ? price : max
    }, toDecimal('0.02')).toFixed(2)
    let items = [...this.state.nfts]

    // User favorites enrichment
    if (currentUserId && this.state.favorites[currentUserId]) {
      const userFavs = new Set(this.state.favorites[currentUserId])
      items = items.map((nft) => ({
        ...nft,
        isLiked: userFavs.has(nft.id),
      }))
    } else {
      items = items.map((nft) => ({ ...nft, isLiked: false }))
    }

    // Search query
    if (params.search && params.search.trim()) {
      const q = params.search.toLowerCase().trim()
      items = items.filter(
        (nft) =>
          nft.name.toLowerCase().includes(q) ||
          nft.collection.toLowerCase().includes(q) ||
          nft.creator.name.toLowerCase().includes(q)
      )
    }

    // Category
    if (params.category && params.category !== 'all') {
      items = items.filter((nft) => nft.category === params.category)
    }

    // Min Price
    if (params.minPrice) {
      const min = toDecimal(params.minPrice)
      items = items.filter((nft) => toDecimal(nft.price).greaterThanOrEqualTo(min))
    }

    // Max Price
    if (params.maxPrice) {
      const max = toDecimal(params.maxPrice)
      items = items.filter((nft) => toDecimal(nft.price).lessThanOrEqualTo(max))
    }

    // Status
    if (params.status === 'available') {
      items = items.filter((nft) => !nft.isSoldOut && nft.availableSupply > 0)
    } else if (params.status === 'sold_out') {
      items = items.filter((nft) => nft.isSoldOut || nft.availableSupply <= 0)
    }

    // Sort
    const sort = params.sort || 'recent'
    items.sort((a, b) => {
      switch (sort) {
        case 'price_asc':
          return toDecimal(a.price).comparedTo(toDecimal(b.price))
        case 'price_desc':
          return toDecimal(b.price).comparedTo(toDecimal(a.price))
        case 'popular':
          return b.likes - a.likes
        case 'recent':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
    })

    const page = Math.max(1, params.page || 1)
    const limit = Math.max(1, params.limit || 9)
    const total = items.length
    const totalPages = Math.ceil(total / limit) || 1
    const offset = (page - 1) * limit
    const paginatedItems = items.slice(offset, offset + limit)

    return {
      items: paginatedItems,
      total,
      page,
      totalPages,
      limit,
      maxAvailablePrice,
    }
  }

  public getNFTById(id: string, currentUserId?: string): NFT | null {
    const nft = this.state.nfts.find((n) => n.id === id)
    if (!nft) return null

    let isLiked = false
    if (currentUserId && this.state.favorites[currentUserId]) {
      isLiked = this.state.favorites[currentUserId].includes(id)
    }

    return {
      ...nft,
      isLiked,
    }
  }

  public updateNFT(
    id: string,
    updates: Partial<Pick<NFT, 'price' | 'availableSupply' | 'isSoldOut'>>
  ): NFT | null {
    const index = this.state.nfts.findIndex((n) => n.id === id)
    if (index === -1) return null

    const existing = this.state.nfts[index]
    const updated = {
      ...existing,
      ...updates,
      version: existing.version + 1,
      updatedAt: new Date().toISOString(),
    }
    if (updates.availableSupply !== undefined) {
      updated.isSoldOut = updates.availableSupply <= 0
    }
    this.state.nfts[index] = updated
    this.persist()
    return updated
  }

  // Favorites
  public toggleFavorite(userId: string, nftId: string): { isLiked: boolean; likes: number } {
    if (!this.state.favorites[userId]) {
      this.state.favorites[userId] = []
    }

    const favList = this.state.favorites[userId]
    const existsIndex = favList.indexOf(nftId)
    const nft = this.state.nfts.find((n) => n.id === nftId)

    let isLiked = false
    if (existsIndex > -1) {
      favList.splice(existsIndex, 1)
      if (nft) nft.likes = Math.max(0, nft.likes - 1)
      isLiked = false
    } else {
      favList.push(nftId)
      if (nft) nft.likes += 1
      isLiked = true
    }

    this.persist()
    return { isLiked, likes: nft ? nft.likes : 0 }
  }

  public getFavorites(userId: string): NFT[] {
    const favIds = this.state.favorites[userId] || []
    return this.state.nfts
      .filter((n) => favIds.includes(n.id))
      .map((n) => ({ ...n, isLiked: true }))
  }

  // Auth & Users
  public getUserByEmail(email: string) {
    return this.state.users.find((u) => u.email.toLowerCase() === email.toLowerCase())
  }

  public getUserById(id: string) {
    const u = this.state.users.find((user) => user.id === id)
    if (!u) return null
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...userClean } = u
    return userClean
  }

  public createUser(name: string, email: string, passwordHash: string): User {
    const newUser = {
      id: `user-${Date.now()}`,
      name,
      email,
      avatar: '/avatars/creator.svg',
      createdAt: new Date().toISOString(),
      passwordHash,
    }
    this.state.users.push(newUser)
    this.persist()
    const { passwordHash: _, ...clean } = newUser
    return clean
  }

  public updateUser(userId: string, data: Partial<Pick<User, 'name' | 'username' | 'email' | 'avatar' | 'walletAlias' | 'ensName' | 'ensSuffix'>>): User | null {
    const user = this.state.users.find((u) => u.id === userId)
    if (!user) return null

    if (data.name) user.name = data.name
    if (data.email) user.email = data.email
    if (data.avatar) user.avatar = data.avatar
    if (data.username !== undefined) user.username = data.username
    if (data.walletAlias !== undefined) user.walletAlias = data.walletAlias
    if (data.ensName !== undefined) user.ensName = data.ensName
    if (data.ensSuffix !== undefined) user.ensSuffix = data.ensSuffix

    this.persist()
    const { passwordHash: _, ...clean } = user
    return clean
  }

  public updatePassword(userId: string, oldPasswordHash: string, newPasswordHash: string): boolean {
    const user = this.state.users.find((u) => u.id === userId)
    if (!user) return false
    if (user.passwordHash !== oldPasswordHash) return false

    user.passwordHash = newPasswordHash
    this.persist()
    return true
  }

  // Wallets
  public getWallets(userId: string): Wallet[] {
    return this.state.wallets.filter((w) => w.userId === userId)
  }

  public addWallet(userId: string, walletData: Omit<Wallet, 'id' | 'userId' | 'createdAt'>): Wallet {
    const userWallets = this.getWallets(userId)
    const isFirst = userWallets.length === 0

    if (walletData.isPrimary || isFirst) {
      this.state.wallets
        .filter((w) => w.userId === userId)
        .forEach((w) => (w.isPrimary = false))
    }

    const newWallet: Wallet = {
      ...walletData,
      id: `wallet-${Date.now()}`,
      userId,
      isPrimary: walletData.isPrimary || isFirst,
      createdAt: new Date().toISOString(),
    }

    this.state.wallets.push(newWallet)
    this.persist()
    return newWallet
  }

  public setPrimaryWallet(userId: string, walletId: string): boolean {
    const userWallets = this.state.wallets.filter((w) => w.userId === userId)
    const target = userWallets.find((w) => w.id === walletId)
    if (!target) return false

    userWallets.forEach((w) => (w.isPrimary = w.id === walletId))
    this.persist()
    return true
  }

  public updateWalletNetwork(userId: string, walletId: string, network: Wallet['network']): boolean {
    const wallet = this.state.wallets.find((item) => item.userId === userId && item.id === walletId)
    if (!wallet) return false

    wallet.network = network
    this.persist()
    return true
  }

  public updateWalletProfile(
    userId: string,
    walletId: string,
    data: Pick<Wallet, 'walletAlias' | 'profileName' | 'ensOrSecondary' | 'referralCode' | 'ensName' | 'ensSuffix'>
  ): boolean {
    const wallet = this.state.wallets.find((item) => item.userId === userId && item.id === walletId)
    if (!wallet) return false

    Object.assign(wallet, data)
    this.persist()
    return true
  }

  public removeWallet(userId: string, walletId: string): boolean {
    const index = this.state.wallets.findIndex((w) => w.userId === userId && w.id === walletId)
    if (index === -1) return false

    const wasPrimary = this.state.wallets[index].isPrimary
    this.state.wallets.splice(index, 1)

    if (wasPrimary) {
      const remaining = this.state.wallets.filter((w) => w.userId === userId)
      if (remaining.length > 0) {
        remaining[0].isPrimary = true
      }
    }

    this.persist()
    return true
  }

  // Cart
  public getCart(userId?: string): CartItem[] {
    const rawItems = userId ? this.state.carts[userId] || [] : this.state.guestCart
    // Reconcile with latest NFT details
    return rawItems.map((item) => {
      const currentNft = this.state.nfts.find((n) => n.id === item.nftId)
      return {
        ...item,
        nft: currentNft || item.nft,
      }
    })
  }

  public saveCart(items: CartItem[], userId?: string) {
    if (userId) {
      this.state.carts[userId] = items
    } else {
      this.state.guestCart = items
    }
    this.persist()
  }

  public mergeGuestCartIntoUser(userId: string) {
    if (!this.state.guestCart.length) return
    const userCart = this.state.carts[userId] || []
    for (const guestItem of this.state.guestCart) {
      const existing = userCart.find((i) => i.nftId === guestItem.nftId)
      if (existing) {
        existing.quantity += guestItem.quantity
      } else {
        userCart.push(guestItem)
      }
    }
    this.state.carts[userId] = userCart
    this.state.guestCart = []
    this.persist()
  }

  // Coupons
  public validateCoupon(code: string): Coupon | null {
    const coupon = this.state.coupons.find(
      (c) => c.code.toUpperCase() === code.trim().toUpperCase()
    )
    if (!coupon) return null
    const isExpired = new Date(coupon.expiresAt).getTime() < Date.now()
    if (isExpired || !coupon.valid) {
      return { ...coupon, valid: false }
    }
    return coupon
  }

  // Quote Generation with precise Decimal.js calculations
  public generateQuote(items: Array<{ nftId: string; quantity: number }>, couponCode?: string): OrderQuote {
    let subtotal = '0.0000'
    let hasPriceChanges = false
    let hasAvailabilityIssues = false

    const quoteItems: QuoteItem[] = items.map((reqItem) => {
      const nft = this.state.nfts.find((n) => n.id === reqItem.nftId)
      if (!nft) {
        hasAvailabilityIssues = true
        return {
          nftId: reqItem.nftId,
          name: 'Item não encontrado',
          quantity: reqItem.quantity,
          unitPrice: '0.0000',
          lineTotal: '0.0000',
          available: false,
          availableSupply: 0,
          priceChanged: false,
          currentPrice: '0.0000',
        }
      }

      const available = !nft.isSoldOut && nft.availableSupply >= reqItem.quantity
      if (!available) {
        hasAvailabilityIssues = true
      }

      const lineTotal = mulEth(nft.price, reqItem.quantity)
      subtotal = toDecimal(subtotal).plus(toDecimal(lineTotal)).toFixed(4)

      return {
        nftId: nft.id,
        name: nft.name,
        quantity: reqItem.quantity,
        unitPrice: nft.price,
        lineTotal,
        available,
        availableSupply: nft.availableSupply,
        priceChanged: false,
        currentPrice: nft.price,
      }
    })

    let discountPercent = 0
    let discount = '0.0000'

    if (couponCode) {
      const coupon = this.validateCoupon(couponCode)
      if (coupon && coupon.valid) {
        discountPercent = coupon.discountPercent
        discount = calcDiscountPercent(subtotal, discountPercent)
      }
    }

    // Simulated standard Ethereum transaction gas fee
    const gasFee = items.length > 0 ? '0.0045' : '0.0000'
    const total = calcOrderTotal(subtotal, discount, gasFee)

    const quoteId = `quote-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`

    return {
      quoteId,
      items: quoteItems,
      subtotal,
      discount,
      gasFee,
      total,
      couponCode,
      discountPercent,
      validUntil: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
      hasPriceChanges,
      hasAvailabilityIssues,
    }
  }

  // Idempotent Order Creation
  public createOrder(
    userId: string,
    payload: CreateOrderPayload
  ): { status: 'created' | 'existing'; order: OrderReceipt; conflict?: boolean } {
    const { idempotencyKey } = payload

    // 1. Check if idempotency key was previously processed
    const existingEntry = this.state.ordersByIdempotency[idempotencyKey]
    if (existingEntry) {
      const currentPayloadHash = hashPayload({
        items: payload.items,
        walletAddress: payload.walletAddress,
        network: payload.network,
        couponCode: payload.couponCode,
      })

      if (existingEntry.payloadHash === currentPayloadHash) {
        // Idempotent replay: return the exact same order
        return { status: 'existing', order: existingEntry.order }
      } else {
        // Reusing same idempotency key with different payload -> 409 Conflict
        return { status: 'existing', order: existingEntry.order, conflict: true }
      }
    }

    // 2. Validate availability and build immutable snapshot
    const quote = this.generateQuote(payload.items, payload.couponCode)

    if (quote.hasAvailabilityIssues) {
      throw new Error('Um ou mais itens solicitados não estão mais disponíveis no estoque.')
    }

    // Deduct stock from NFTs
    for (const reqItem of payload.items) {
      const nft = this.state.nfts.find((n) => n.id === reqItem.nftId)
      if (nft) {
        nft.availableSupply = Math.max(0, nft.availableSupply - reqItem.quantity)
        if (nft.availableSupply === 0) {
          nft.isSoldOut = true
        }
        nft.version += 1
        nft.updatedAt = new Date().toISOString()
      }
    }

    const orderId = `order-${Date.now()}`
    const txHash = `0x${Array.from({ length: 64 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('')}`

    const snapshots = quote.items.map((qi) => {
      const nft = this.state.nfts.find((n) => n.id === qi.nftId)
      return {
        nftId: qi.nftId,
        name: qi.name,
        collection: nft?.collection || 'Bored Ape Yacht Club',
        image: nft?.image || '/nfts/figma/img4_8459.avif',
        quantity: qi.quantity,
        unitPrice: qi.unitPrice,
        lineTotal: qi.lineTotal,
      }
    })

    const newOrder: OrderReceipt = {
      orderId,
      idempotencyKey,
      userId,
      items: snapshots,
      subtotal: quote.subtotal,
      discount: quote.discount,
      gasFee: quote.gasFee,
      total: quote.total,
      couponCode: payload.couponCode,
      walletAddress: payload.walletAddress,
      network: payload.network,
      txHash,
      status: payload.simulateFailure ? 'failed' : this.getScenario() === 'order_pending' ? 'pending' : 'confirmed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      confirmedAt: payload.simulateFailure ? undefined : new Date().toISOString(),
      version: 1,
    }
    if (newOrder.status === 'pending') newOrder.confirmedAt = undefined

    this.state.orders.unshift(newOrder)

    // Store in idempotency ledger
    const payloadHash = hashPayload({
      items: payload.items,
      walletAddress: payload.walletAddress,
      network: payload.network,
      couponCode: payload.couponCode,
    })
    this.state.ordersByIdempotency[idempotencyKey] = {
      order: newOrder,
      payloadHash,
    }

    // Clear bought items and exact quantities from user cart only upon confirmed success
    if (newOrder.status === 'confirmed') {
      this.removePurchasedCartItems(userId, payload.items)
    }

    this.persist()
    return { status: 'created', order: newOrder }
  }

  public getOrderById(orderId: string): OrderReceipt | null {
    return this.state.orders.find((o) => o.orderId === orderId) || null
  }

  private removePurchasedCartItems(userId: string, purchasedItems: CreateOrderPayload['items']) {
    const updatedCart: CartItem[] = []
    for (const cartItem of this.state.carts[userId] || []) {
      const bought = purchasedItems.find((item) => item.nftId === cartItem.nftId)
      if (!bought) updatedCart.push(cartItem)
      else if (cartItem.quantity > bought.quantity) {
        updatedCart.push({ ...cartItem, quantity: cartItem.quantity - bought.quantity })
      }
    }
    this.state.carts[userId] = updatedCart
  }

  public updateOrderStatus(orderId: string, status: 'confirmed' | 'failed'): OrderReceipt | null {
    const order = this.getOrderById(orderId)
    if (!order || order.status !== 'pending') return null

    const now = new Date().toISOString()
    order.status = status
    order.updatedAt = now
    order.version += 1
    if (status === 'confirmed') {
      order.confirmedAt = now
      this.removePurchasedCartItems(order.userId, order.items)
    } else {
      order.confirmedAt = undefined
      for (const item of order.items) {
        const nft = this.state.nfts.find((candidate) => candidate.id === item.nftId)
        if (!nft) continue
        nft.availableSupply += item.quantity
        nft.isSoldOut = nft.availableSupply <= 0
        nft.version += 1
        nft.updatedAt = now
      }
    }
    this.persist()
    return order
  }

  public getOrderByIdempotencyKey(userId: string, idempotencyKey: string): OrderReceipt | null {
    const order = this.state.ordersByIdempotency[idempotencyKey]?.order
    return order?.userId === userId ? order : null
  }

  public getOrdersByUser(userId: string): OrderReceipt[] {
    return this.state.orders.filter((o) => o.userId === userId)
  }
}

export const mockDB = new MockDatabase()
