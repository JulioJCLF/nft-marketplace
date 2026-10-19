import React, { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Decimal } from 'decimal.js'
import { useCart } from './CartContext'
import { formatEth, formatUsdEquivalent } from '@/lib/eth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { INITIAL_NFTS } from '@/mocks/fixtures'
import { NFTCard } from '@/features/catalog/NFTCard'
import {
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Tag,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react'

export const CartPage: React.FC = () => {
  const {
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
    updateQuantity,
    removeFromCart,
    applyCoupon,
    removeCoupon,
  } = useCart()

  const [couponInput, setCouponInput] = useState('')
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false)

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!couponInput.trim()) return
    setIsApplyingCoupon(true)
    await applyCoupon(couponInput.trim())
    setIsApplyingCoupon(false)
  }

  const recommendedNFTs = INITIAL_NFTS.slice(0, 5)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Breadcrumb */}
      <div>
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-foreground-muted hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Voltar ao Catálogo</span>
        </Link>
      </div>

      {/* Page Header */}
      <div className="border-b border-border pb-6 flex items-baseline justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            Carrinho de Compras
          </h1>
          <p className="text-xs sm:text-sm text-foreground-muted mt-1">
            Revise seus itens, aplique cupons promocionais e prossiga para a liquidação web3.
          </p>
        </div>
        <span className="text-xs font-mono font-bold text-primary px-3 py-1.5 rounded-full border border-primary/30 bg-primary/10">
          {itemCount} {itemCount === 1 ? 'item' : 'itens'} no carrinho
        </span>
      </div>

      {items.length === 0 ? (
        /* Empty State */
        <div className="py-20 text-center rounded-2xl border border-border bg-surface/50 space-y-5 max-w-2xl mx-auto p-8 shadow-xl">
          <div className="w-20 h-20 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center mx-auto">
            <ShoppingBag className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Seu carrinho está vazio</h2>
          <p className="text-xs sm:text-sm text-foreground-muted max-w-md mx-auto leading-relaxed">
            Explore nossa galeria de arte digital e selecione as melhores obras exclusivas para a sua coleção.
          </p>
          <div className="pt-2">
            <Link to="/">
              <Button size="lg" className="font-bold gap-2">
                <span>Explorar Catálogo</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        /* Full Cart Grid */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Table of Items (8 cols) */}
          <div className="lg:col-span-8 rounded-2xl border border-border bg-surface overflow-hidden shadow-xl">
            {/* Table Header */}
            <div className="hidden sm:grid grid-cols-12 gap-4 px-6 py-4 bg-surface-secondary/60 border-b border-border text-[11px] font-bold uppercase tracking-wider text-foreground-muted">
              <div className="col-span-6">Obra & Coleção</div>
              <div className="col-span-2 text-right">Preço</div>
              <div className="col-span-2 text-center">Quantidade</div>
              <div className="col-span-2 text-right">Subtotal</div>
            </div>

            {/* Items List */}
            <div className="divide-y divide-border/60">
              {items.map((item) => (
                <div
                  key={item.nftId}
                  className="p-5 sm:px-6 sm:py-5 flex flex-col sm:grid sm:grid-cols-12 gap-4 items-center justify-between hover:bg-surface-secondary/20 transition-colors"
                >
                  {/* NFT Info */}
                  <div className="sm:col-span-6 flex items-center gap-4 w-full">
                    <Link to="/nft/$nftId" params={{ nftId: item.nftId }} className="flex-shrink-0">
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-surface-tertiary border border-border">
                        <img src={item.nft.image} alt={item.nft.name} className="w-full h-full object-cover" />
                      </div>
                    </Link>
                    <div className="min-w-0 flex-1">
                      <Link
                        to="/nft/$nftId"
                        params={{ nftId: item.nftId }}
                        className="font-bold text-sm text-foreground hover:text-primary transition-colors block truncate"
                      >
                        {item.nft.name}
                      </Link>
                      <span className="text-xs text-foreground-muted block truncate">{item.nft.collection}</span>
                      <span className="text-[10px] text-emerald-400 font-medium block mt-0.5">
                        {item.nft.availableSupply} em estoque
                      </span>
                    </div>
                  </div>

                  {/* Unit Price */}
                  <div className="sm:col-span-2 sm:text-right w-full flex justify-between sm:block">
                    <span className="sm:hidden text-xs text-foreground-muted">Preço Unitário:</span>
                    <span className="font-mono font-bold text-xs text-foreground">
                      {formatEth(item.nft.price)}
                    </span>
                  </div>

                  {/* Quantity Control */}
                  <div className="sm:col-span-2 flex items-center justify-center w-full sm:w-auto">
                    <div className="flex items-center border border-border rounded-lg bg-surface-secondary">
                      <button
                        onClick={() => updateQuantity(item.nftId, item.quantity - 1)}
                        className="p-1.5 text-foreground-muted hover:text-foreground transition-colors"
                        aria-label="Diminuir quantidade"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-3 text-xs font-bold font-mono text-foreground min-w-[28px] text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.nftId, item.quantity + 1)}
                        disabled={item.quantity >= item.nft.availableSupply}
                        className="p-1.5 text-foreground-muted hover:text-foreground disabled:opacity-30 transition-colors"
                        aria-label="Aumentar quantidade"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Line Total & Remove */}
                  <div className="sm:col-span-2 sm:text-right flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-0 border-border/40">
                    <span className="font-mono font-bold text-sm text-primary">
                      {formatEth(new Decimal(item.unitPrice).times(item.quantity).toFixed(4))}
                    </span>
                    <button
                      onClick={() => removeFromCart(item.nftId)}
                      className="p-1.5 rounded-lg text-foreground-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      aria-label={`Remover ${item.nft.name} do carrinho`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Sticky Order Summary (4 cols) */}
          <div className="lg:col-span-4 sticky top-28 space-y-6">
            <div className="rounded-2xl border border-border bg-surface p-6 shadow-xl space-y-6">
              <h2 className="text-lg font-bold text-foreground">Resumo do Pedido</h2>

              {/* Coupon Form */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-foreground-muted">Cupom Promocional</label>
                <form onSubmit={handleApply} className="flex gap-2">
                  <Input
                    placeholder="Ex: DESC10, ETH5"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    className="h-10 text-xs font-mono uppercase"
                  />
                  <Button
                    type="submit"
                    variant="secondary"
                    isLoading={isApplyingCoupon}
                    className="font-bold px-4"
                  >
                    Aplicar
                  </Button>
                </form>

                {couponMessage && (
                  <div className="flex items-center gap-1.5 text-emerald-400 text-xs pt-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{couponMessage}</span>
                  </div>
                )}

                {couponError && (
                  <div className="flex items-center gap-1.5 text-red-400 text-xs pt-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{couponError}</span>
                  </div>
                )}

                {couponCode && discountPercent > 0 && (
                  <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400">
                    <div className="flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5" />
                      <span className="font-bold">{couponCode}</span>
                      <span>(-{discountPercent}%)</span>
                    </div>
                    <button
                      onClick={removeCoupon}
                      className="text-[11px] underline hover:text-emerald-300 font-semibold"
                    >
                      Remover
                    </button>
                  </div>
                )}
              </div>

              {/* Calculations breakdown */}
              <div className="space-y-3 pt-4 border-t border-border/80 text-xs">
                <div className="flex justify-between text-foreground-muted">
                  <span>Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'itens'})</span>
                  <span className="font-mono font-semibold text-foreground">{formatEth(subtotalEth)}</span>
                </div>

                {discountEth !== '0.0000' && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Desconto do Cupom</span>
                    <span className="font-mono font-semibold">- {formatEth(discountEth)}</span>
                  </div>
                )}

                <div className="flex justify-between text-foreground-muted">
                  <span>Taxa de Rede (Gas Fee)</span>
                  <span className="font-mono font-semibold text-foreground">{formatEth(gasFeeEth)}</span>
                </div>

                <div className="pt-3 border-t border-border flex justify-between items-baseline">
                  <div>
                    <span className="text-sm font-extrabold text-foreground block">Total Estimado</span>
                    <span className="text-[11px] text-foreground-muted block mt-0.5">
                      ≈ {formatUsdEquivalent(totalEth)} USD
                    </span>
                  </div>
                  <span className="font-mono font-black text-2xl text-primary">
                    {formatEth(totalEth)}
                  </span>
                </div>
              </div>

              {/* Checkout Action Button */}
              <Link to="/checkout" className="block pt-2">
                <Button size="lg" className="w-full font-bold text-base gap-2 shadow-xl">
                  <span>Finalizar Compra</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>

              <div className="flex items-center justify-center gap-2 text-[11px] text-foreground-muted pt-2 text-center">
                <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                <span>Cotação e estoque garantidos com idempotência</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recommended Section (Frame 3 bottom) */}
      <div className="pt-12 border-t border-border space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
              Você Também Pode Gostar
            </h2>
            <p className="text-xs text-foreground-muted mt-1">
              Colecionáveis em alta recomendados para você
            </p>
          </div>
          <Link to="/" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
            <span>Ver Catálogo Completo</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {recommendedNFTs.map((nft) => (
            <NFTCard key={nft.id} nft={nft} />
          ))}
        </div>
      </div>
    </div>
  )
}
