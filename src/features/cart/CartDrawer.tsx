import React, { useState } from 'react'
import { X, Trash2, Plus, Minus, ShoppingCart, ArrowRight, Tag, AlertCircle } from 'lucide-react'
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
        className="fixed inset-0 hidden bg-black/75 backdrop-blur-md transition-opacity sm:block"
        onClick={() => setIsCartDrawerOpen(false)}
        aria-hidden="true"
      />

      <div className="fixed inset-0 flex max-w-full sm:inset-y-0 sm:left-auto sm:right-0 sm:pl-10">
        <div className="flex h-[100dvh] w-full flex-col bg-background sm:h-auto sm:w-screen sm:max-w-[460px] sm:border-l sm:border-border/80 sm:shadow-[-24px_0_80px_rgba(0,0,0,0.55)]">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 sm:px-6 sm:py-5 border-b border-border/80 bg-surface/70">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/25 bg-primary/10">
                <ShoppingCart className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground sm:text-lg">Carrinho de compras</h2>
                <p className="mt-0.5 text-[11px] text-foreground-muted">{itemCount} {itemCount === 1 ? 'item' : 'itens'} selecionados</p>
              </div>
            </div>
            <button
              onClick={() => setIsCartDrawerOpen(false)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-foreground-muted transition-colors hover:border-primary/50 hover:bg-surface-secondary hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="Fechar carrinho"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6 space-y-3">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-16 h-16 rounded-full border border-primary/20 bg-primary/10 flex items-center justify-center text-primary">
                  <ShoppingCart className="w-8 h-8 opacity-40" />
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
                  className="mt-2 rounded-full border-primary/50 px-5"
                >
                  Explorar Catálogo
                </Button>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.nftId}
                  className="flex gap-3 rounded-2xl border border-border/80 bg-surface/80 p-3 transition-colors hover:border-primary/35 sm:gap-4 sm:p-4"
                >
                  <img
                    src={item.nft.image}
                    alt={item.nft.name}
                    className="h-20 w-20 shrink-0 rounded-xl border border-border/70 bg-surface-tertiary object-cover sm:h-24 sm:w-24"
                  />
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="truncate">
                        <h4 className="block truncate text-sm font-bold text-foreground sm:text-[15px]">{item.nft.name}</h4>
                        <p className="mt-1 block truncate text-[11px] text-foreground-muted">{item.nft.collection}</p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.nftId)}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-foreground-subtle transition-colors hover:bg-red-500/10 hover:text-red-400"
                        aria-label={`Remover ${item.nft.name} do carrinho`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="mt-3 flex items-end justify-between gap-2 border-t border-border/50 pt-3">
                      <div>
                        <span className="font-mono text-sm font-bold text-primary sm:text-base">
                          {formatEth(item.nft.price)}
                        </span>
                        <div className="mt-1 text-[10px] text-foreground-muted">
                          {formatUsdEquivalent(item.nft.price)}
                        </div>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex h-9 items-center rounded-full border border-border bg-background/80">
                        <button
                          onClick={() => updateQuantity(item.nftId, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="flex h-8 w-8 items-center justify-center rounded-full text-foreground-muted transition-colors hover:text-primary disabled:opacity-30"
                          aria-label="Diminuir quantidade"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="min-w-[24px] px-1 text-center font-mono text-xs font-semibold text-foreground">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.nftId, item.quantity + 1)}
                          disabled={item.quantity >= item.nft.availableSupply}
                          className="flex h-8 w-8 items-center justify-center rounded-full text-foreground-muted transition-colors hover:text-primary disabled:opacity-30"
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
            <div className="space-y-4 border-t border-border/80 bg-surface/95 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:p-6">
              {/* Coupon Form */}
              <div className="space-y-2">
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
                      className="h-10 min-w-0 flex-1 rounded-full border border-border bg-background px-4 text-xs font-mono uppercase text-foreground placeholder:text-foreground-muted focus:border-primary/70 focus:outline-none focus:ring-1 focus:ring-primary"
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
              <div className="space-y-3 border-t border-border/60 pt-4 text-xs">
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
                <div className="flex items-center justify-between gap-3 rounded-xl border border-primary/20 bg-background/70 p-4 font-bold text-foreground">
                  <span>Total</span>
                  <div className="text-right">
                    <div className="font-mono text-lg font-bold text-primary">{formatEth(totalEth)}</div>
                    <div className="text-[11px] text-foreground-muted font-normal">
                      ≈ {formatUsdEquivalent(totalEth)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Checkout & View Cart CTAs */}
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCartDrawerOpen(false)
                    navigate({ to: '/cart' })
                  }}
                  className="h-10 w-full rounded-full border-border/80 font-semibold text-xs"
                >
                  Ver Carrinho Completo
                </Button>
                <Button onClick={handleCheckout} className="h-12 w-full gap-2 rounded-full font-bold" size="default">
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
