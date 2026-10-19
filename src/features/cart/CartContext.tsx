import React, { createContext, useContext, useState, useMemo, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { CartItem, NFT, OrderQuote } from '@/types'
import { mulEth, calcDiscountPercent, calcOrderTotal, toDecimal } from '@/lib/eth'
import { useAuth } from '@/features/auth/AuthContext'

interface CartContextValue {
  items: CartItem[]
  itemCount: number
  subtotalEth: string
  discountEth: string
  gasFeeEth: string
  totalEth: string
  couponCode: string
  discountPercent: number
  couponMessage: string | null
  couponError: string | null
  isCartDrawerOpen: boolean
  setIsCartDrawerOpen: (open: boolean) => void
  addToCart: (nft: NFT, quantity?: number) => Promise<void>
  updateQuantity: (nftId: string, quantity: number) => Promise<void>
  removeFromCart: (nftId: string) => Promise<void>
  applyCoupon: (code: string) => Promise<boolean>
  removeCoupon: () => void
  clearCart: () => Promise<void>
  fetchQuote: () => Promise<OrderQuote | null>
  quoteData: OrderQuote | null
  isQuoteLoading: boolean
}

const CartContext = createContext<CartContextValue | null>(null)

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false)
  const [couponCode, setCouponCode] = useState<string>('')
  const [discountPercent, setDiscountPercent] = useState<number>(0)
  const [couponMessage, setCouponMessage] = useState<string | null>(null)
  const [couponError, setCouponError] = useState<string | null>(null)

  // Fetch Cart using TanStack Query via Axios
  const { data: cartData } = useQuery<{ items: CartItem[] }>({
    queryKey: ['cart', user?.id || 'guest'],
    queryFn: async () => {
      const response = await api.get<{ items: CartItem[] }>('/cart')
      return response.data
    },
    staleTime: 1000 * 30, // 30 seconds
  })

  const items = useMemo(() => cartData?.items || [], [cartData])

  const itemCount = useMemo(
    () => items.reduce((acc, item) => acc + item.quantity, 0),
    [items]
  )

  // Compute subtotal, discount, fee, and total using Decimal.js
  const subtotalEth = useMemo(() => {
    return items
      .reduce((acc, item) => {
        const line = mulEth(item.nft.price, item.quantity)
        return acc.plus(toDecimal(line))
      }, toDecimal(0))
      .toFixed(4)
  }, [items])

  const discountEth = useMemo(() => {
    return calcDiscountPercent(subtotalEth, discountPercent)
  }, [subtotalEth, discountPercent])

  const gasFeeEth = useMemo(() => {
    return items.length > 0 ? '0.0045' : '0.0000'
  }, [items.length])

  const totalEth = useMemo(() => {
    return calcOrderTotal(subtotalEth, discountEth, gasFeeEth)
  }, [subtotalEth, discountEth, gasFeeEth])

  // Real-time Quote query via TanStack Query
  const { data: quoteData, isLoading: isQuoteLoading, refetch: refetchQuote } = useQuery<OrderQuote>({
    queryKey: ['quote', items.map((i) => `${i.nftId}-${i.quantity}-${i.nft.price}`).join('|'), couponCode],
    queryFn: async () => {
      if (items.length === 0) {
        return {
          quoteId: 'quote-empty',
          items: [],
          subtotal: '0.0000',
          discount: '0.0000',
          gasFee: '0.0000',
          total: '0.0000',
          discountPercent: 0,
          validUntil: new Date().toISOString(),
          hasPriceChanges: false,
          hasAvailabilityIssues: false,
        }
      }
      const res = await api.post<OrderQuote>('/quote', {
        items: items.map((i) => ({ nftId: i.nftId, quantity: i.quantity })),
        couponCode: couponCode || undefined,
      })
      return res.data
    },
    enabled: items.length > 0,
    staleTime: 1000 * 10,
  })

  // Add Item Mutation
  const addMutation = useMutation({
    mutationFn: async ({ nftId, quantity }: { nftId: string; quantity: number }) => {
      const res = await api.post<{ items: CartItem[] }>('/cart/items', { nftId, quantity })
      return res.data
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['cart', user?.id || 'guest'], data)
      setIsCartDrawerOpen(true)
    },
  })

  // Update Quantity Mutation
  const updateMutation = useMutation({
    mutationFn: async ({ nftId, quantity }: { nftId: string; quantity: number }) => {
      const res = await api.put<{ items: CartItem[] }>(`/cart/items/${nftId}`, { quantity })
      return res.data
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['cart', user?.id || 'guest'], data)
    },
  })

  // Remove Item Mutation
  const removeMutation = useMutation({
    mutationFn: async (nftId: string) => {
      const res = await api.delete<{ items: CartItem[] }>(`/cart/items/${nftId}`)
      return res.data
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['cart', user?.id || 'guest'], data)
    },
  })

  const addToCart = useCallback(
    async (nft: NFT, quantity = 1) => {
      await addMutation.mutateAsync({ nftId: nft.id, quantity })
    },
    [addMutation]
  )

  const updateQuantity = useCallback(
    async (nftId: string, quantity: number) => {
      await updateMutation.mutateAsync({ nftId, quantity })
    },
    [updateMutation]
  )

  const removeFromCart = useCallback(
    async (nftId: string) => {
      await removeMutation.mutateAsync(nftId)
    },
    [removeMutation]
  )

  const applyCoupon = useCallback(async (code: string): Promise<boolean> => {
    setCouponError(null)
    setCouponMessage(null)
    try {
      const res = await api.post<{
        valid: boolean
        coupon: { code: string; discountPercent: number; description: string }
        message: string
      }>('/coupons/validate', { code })

      if (res.data.valid) {
        setCouponCode(res.data.coupon.code)
        setDiscountPercent(res.data.coupon.discountPercent)
        setCouponMessage(res.data.message)
        return true
      }
      return false
    } catch (err: unknown) {
      const msg = (err as Error).message || 'Cupom inválido ou expirado'
      setCouponError(msg)
      return false
    }
  }, [])

  const removeCoupon = useCallback(() => {
    setCouponCode('')
    setDiscountPercent(0)
    setCouponMessage(null)
    setCouponError(null)
  }, [])

  const clearCart = useCallback(async () => {
    const res = await api.post<{ items: CartItem[] }>('/cart', { items: [] })
    queryClient.setQueryData(['cart', user?.id || 'guest'], res.data)
  }, [queryClient, user?.id])

  const fetchQuote = useCallback(async () => {
    const res = await refetchQuote()
    return res.data || null
  }, [refetchQuote])

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        subtotalEth,
        discountEth,
        gasFeeEth,
        totalEth,
        couponCode,
        discountPercent,
        couponMessage,
        couponError,
        isCartDrawerOpen,
        setIsCartDrawerOpen,
        addToCart,
        updateQuantity,
        removeFromCart,
        applyCoupon,
        removeCoupon,
        clearCart,
        fetchQuote,
        quoteData: quoteData || null,
        isQuoteLoading,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) {
    throw new Error('useCart deve ser utilizado dentro de um CartProvider')
  }
  return ctx
}
