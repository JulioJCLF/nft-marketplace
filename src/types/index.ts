export type CategoryType =
  | 'all'
  | 'art'
  | 'photography'
  | 'music'
  | 'metaverse'
  | 'collectibles'
  | 'generative'
  | 'gaming'
  | 'subscriptions'
  | 'utility'

export interface NFTCreator {
  name: string
  avatar: string
  address: string
  verified: boolean
}

export interface NFTTrait {
  type: string
  value: string
  rarity: number
}

export interface NFTHistoryItem {
  event: 'mint' | 'transfer' | 'sale' | 'list'
  price?: string
  from: string
  to: string
  date: string
  txHash: string
}

export interface NFTReview {
  author: string
  rating: number
  comment: string
  isMock: boolean
}

export interface NFT {
  id: string
  name: string
  description: string
  collection: string
  creator: NFTCreator
  price: string // ETH string with 4 decimal places
  image: string
  gallery?: string[]
  edition: string
  totalEditions: number
  availableSupply: number
  isSoldOut: boolean
  category: CategoryType
  likes: number
  rating?: number
  reviewCount?: number
  reviews?: NFTReview[]
  isLiked?: boolean
  traits: NFTTrait[]
  history: NFTHistoryItem[]
  version: number
  createdAt: string
  updatedAt: string
}

export type SortOption = 'recent' | 'price_asc' | 'price_desc' | 'popular'
export type StatusFilter = 'all' | 'available' | 'sold_out'

export interface CatalogSearchParams {
  search?: string
  category?: CategoryType
  minPrice?: string
  maxPrice?: string
  status?: StatusFilter
  sort?: SortOption
  page?: number
  limit?: number
}

export interface CatalogResponse {
  items: NFT[]
  total: number
  page: number
  totalPages: number
  limit: number
  maxAvailablePrice: string
}

export interface CartItem {
  nftId: string
  nft: NFT
  quantity: number
  unitPrice: string // price snapshot at addition time
}

export interface Coupon {
  code: string
  discountPercent: number
  valid: boolean
  expiresAt: string
  description: string
}

export interface QuoteItem {
  nftId: string
  name: string
  quantity: number
  unitPrice: string
  lineTotal: string
  available: boolean
  availableSupply: number
  priceChanged: boolean
  currentPrice: string
}

export interface OrderQuote {
  quoteId: string
  items: QuoteItem[]
  subtotal: string
  discount: string
  gasFee: string
  total: string
  couponCode?: string
  discountPercent: number
  validUntil: string
  hasPriceChanges: boolean
  hasAvailabilityIssues: boolean
}

export interface User {
  id: string
  name: string
  username?: string
  email: string
  avatar: string
  walletAlias?: string
  ensName?: string
  ensSuffix?: string
  createdAt: string
}

export type WalletProvider = 'metamask' | 'coinbase' | 'rainbow' | 'walletconnect'
export type NetworkId = 'mainnet' | 'sepolia' | 'arbitrum' | 'polygon'

export interface Wallet {
  id: string
  userId: string
  provider: WalletProvider
  address: string
  network: NetworkId
  isPrimary: boolean
  balanceEth: string
  walletAlias?: string
  profileName?: string
  ensOrSecondary?: string
  referralCode?: string
  ensName?: string
  ensSuffix?: string
  createdAt: string
}

export type OrderStatus = 'pending' | 'confirmed' | 'failed'

export interface OrderItemSnapshot {
  nftId: string
  name: string
  collection: string
  image: string
  quantity: number
  unitPrice: string
  lineTotal: string
}

export interface OrderReceipt {
  orderId: string
  idempotencyKey: string
  userId: string
  items: OrderItemSnapshot[]
  subtotal: string
  discount: string
  gasFee: string
  total: string
  couponCode?: string
  walletAddress: string
  network: NetworkId
  txHash: string
  status: OrderStatus
  createdAt: string
  updatedAt?: string
  confirmedAt?: string
  version: number
}

export interface CreateOrderPayload {
  idempotencyKey: string
  items: Array<{ nftId: string; quantity: number }>
  couponCode?: string
  walletAddress: string
  network: NetworkId
  acceptedQuoteId: string
  simulateFailure?: boolean
}

// Socket.IO Events
export interface NFTUpdatedEvent {
  id: string // event ID
  version: number
  nftId: string
  price: string
  availableSupply: number
  isSoldOut: boolean
  updatedAt: string
}

export interface OrderUpdatedEvent {
  id: string // event ID
  version: number
  orderId: string
  userId: string
  status: OrderStatus
  txHash: string
  updatedAt: string
}
