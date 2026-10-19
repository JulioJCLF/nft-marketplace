import React, { useState } from 'react'
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, Tag, AlertCircle } from 'lucide-react'
import { useCart } from './CartContext'
import { useAuth } from '@/features/auth/AuthContext'
import { Button } from '@/components/ui/Button'
import { formatEth, formatUsdEquivalent } from '@/lib/eth'
import { useNavigate } from '@tanstack/react-router'

export const CartDrawer: React.FC = () => {
  const {
    items,
    itemCount,
    subtotalEth,
    discountEth,
    gasFeeEth,
    totalEth,
    couponCode,
    discountPercent,
    couponError,
    couponMessage,
    isCartDrawerOpen,
    setIsCartDrawerOpen,
    updateQuantity,
    removeFromCart,
    applyCoupon,
    removeCoupon,
  } = useCart()

  const { isAuthenticated, setAuthModalOpen, setRedirectAfterAuth } = useAuth()
  const navigate = useNavigate()
  const [couponInput, setCouponInput] = useState('')
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false)

  if (!isCartDrawerOpen) return null

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!couponInput.trim()) return
    setIsApplyingCoupon(true)
    const success = await applyCoupon(couponInput.trim())
    setIsApplyingCoupon(false)
    if (success) setCouponInput('')
  }

  const handleCheckout = () => {
    setIsCartDrawerOpen(false)
    if (!isAuthenticated) {
      setRedirectAfterAuth('/checkout')
      setAuthModalOpen(true)
    } else {
      navigate({ to: '/checkout' })
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true" aria-label="Carrinho de compras">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={() => setIsCartDrawerOpen(false)}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-md bg-surface border-l border-border flex flex-col shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-border">
            <div className="flex items-center gap-3">
              <ShoppingBag className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold text-foreground">
                Carrinho ({itemCount} {itemCount === 1 ? 'item' : 'itens'})
              </h2>
            </div>
            <button
              onClick={() => setIsCartDrawerOpen(false)}
              className="rounded-md p-1.5 text-foreground-muted hover:text-foreground hover:bg-surface-secondary focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="Fechar carrinho"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-surface-secondary flex items-center justify-center text-foreground-muted">
                  <ShoppingBag className="w-8 h-8 opacity-40" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-base">Seu carrinho está vazio</h3>
                  <p className="text-sm text-foreground-muted mt-1">
                    Explore o catálogo e adicione primatas exclusivos à sua coleção.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCartDrawerOpen(false)}
                  className="mt-2"
                >
                  Explorar Catálogo
                </Button>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.nftId}
                  className="flex gap-4 p-3 rounded-lg border border-border bg-surface-secondary/50 hover:border-border-light transition-colors"
                >
                  <img
                    src={item.nft.image}
                    alt={item.nft.name}
                    className="w-20 h-20 rounded-md object-cover bg-surface-tertiary flex-shrink-0"
                  />
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <div className="truncate">
                        <h4 className="font-bold text-sm text-foreground truncate">{item.nft.name}</h4>
                        <p className="text-xs text-foreground-muted truncate">{item.nft.collection}</p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.nftId)}
                        className="text-foreground-muted hover:text-red-400 p-1 rounded transition-colors"
                        aria-label={`Remover ${item.nft.name} do carrinho`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/40">
                      <div>
                        <span className="font-mono font-bold text-sm text-primary">
                          {formatEth(item.nft.price)}
                        </span>
                        <div className="text-[10px] text-foreground-muted">
                          {formatUsdEquivalent(item.nft.price)}
                        </div>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center border border-border rounded-md bg-surface">
                        <button
                          onClick={() => updateQuantity(item.nftId, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="px-2 py-1 text-foreground-muted hover:text-foreground disabled:opacity-30"
                          aria-label="Diminuir quantidade"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-2 text-xs font-semibold text-foreground min-w-[20px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.nftId, item.quantity + 1)}
                          disabled={item.quantity >= item.nft.availableSupply}
                          className="px-2 py-1 text-foreground-muted hover:text-foreground disabled:opacity-30"
                          aria-label="Aumentar quantidade"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer with Calculations and Checkout */}
          {items.length > 0 && (
            <div className="p-6 border-t border-border bg-surface-secondary/30 space-y-4">
              {/* Coupon Form */}
              <div className="space-y-1.5">
                {couponCode ? (
                  <div className="flex items-center justify-between p-2 rounded-md bg-primary/10 border border-primary/30 text-xs">
                    <div className="flex items-center gap-2">
                      <Tag className="w-3.5 h-3.5 text-primary" />
                      <span className="font-mono font-bold text-primary">{couponCode}</span>
                      <span className="text-foreground-muted">({discountPercent}% OFF)</span>
                    </div>
                    <button
                      onClick={removeCoupon}
                      className="text-foreground-muted hover:text-red-400 font-semibold"
                    >
                      Remover
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Cupom (ex: DESC10)"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      className="flex-1 h-9 rounded-md border border-border bg-surface px-3 text-xs text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-1 focus:ring-primary uppercase font-mono"
                    />
                    <Button type="submit" size="sm" variant="outline" isLoading={isApplyingCoupon}>
                      Aplicar
                    </Button>
                  </form>
                )}

                {couponMessage && <p className="text-xs text-emerald-400">{couponMessage}</p>}
                {couponError && (
                  <p className="text-xs text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {couponError}
                  </p>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-2 text-xs border-t border-border/40 pt-3">
                <div className="flex justify-between text-foreground-muted">
                  <span>Subtotal</span>
                  <span className="font-mono">{formatEth(subtotalEth)}</span>
                </div>
                {discountPercent > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Desconto ({discountPercent}%)</span>
                    <span className="font-mono">- {formatEth(discountEth)}</span>
                  </div>
                )}
                <div className="flex justify-between text-foreground-muted">
                  <span>Taxa de rede estimada (Gás)</span>
                  <span className="font-mono">{formatEth(gasFeeEth)}</span>
                </div>
                <div className="flex justify-between items-baseline pt-2 border-t border-border font-bold text-sm text-foreground">
                  <span>Total</span>
                  <div className="text-right">
                    <div className="font-mono text-base text-primary">{formatEth(totalEth)}</div>
                    <div className="text-[11px] text-foreground-muted font-normal">
                      ≈ {formatUsdEquivalent(totalEth)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Checkout & View Cart CTAs */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCartDrawerOpen(false)
                    navigate({ to: '/cart' })
                  }}
                  className="flex-1 font-bold text-xs"
                >
                  Ver Carrinho Completo
                </Button>
                <Button onClick={handleCheckout} className="flex-1 gap-2 font-bold" size="default">
                  <span>Finalizar Compra</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
