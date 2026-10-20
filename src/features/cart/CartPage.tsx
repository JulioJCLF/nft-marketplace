import React, { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Decimal } from 'decimal.js'
import { useCart } from './CartContext'
import { formatEth } from '@/lib/eth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { INITIAL_NFTS } from '@/mocks/fixtures'
import {
  Trash2,
  Plus,
  Minus,
  ShoppingCart,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Tag,
  AlertCircle,
} from 'lucide-react'

export const CartPage: React.FC = () => {
  const {
    items,
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

  const couponForm = (
    <div className="space-y-2">
      <label className="block text-xs font-semibold text-foreground">Código promocional</label>
      <form onSubmit={handleApply} className="flex gap-0">
        <Input
          placeholder="Digite o código promocional..."
          value={couponInput}
          onChange={(e) => setCouponInput(e.target.value)}
        className="h-10 min-w-0 rounded-l-sm rounded-r-none border-primary/70 bg-background text-xs font-mono"
        />
        <Button
          type="submit"
          isLoading={isApplyingCoupon}
          className="h-10 shrink-0 rounded-l-none rounded-r-sm px-4 text-xs font-bold"
        >
          Aplicar
        </Button>
      </form>

      {couponMessage && (
        <div className="flex items-center gap-1.5 pt-1 text-xs text-emerald-400">
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>{couponMessage}</span>
        </div>
      )}
      {couponError && (
        <div className="flex items-center gap-1.5 pt-1 text-xs text-red-400">
          <AlertCircle className="h-3.5 w-3.5" />
          <span>{couponError}</span>
        </div>
      )}
      {couponCode && discountPercent > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-2 text-xs text-emerald-400">
          <div className="flex items-center gap-1.5">
            <Tag className="h-3.5 w-3.5" />
            <span className="font-bold">{couponCode}</span>
            <span>(-{discountPercent}%)</span>
          </div>
          <button onClick={removeCoupon} className="text-[11px] font-semibold underline hover:text-emerald-300">
            Remover
          </button>
        </div>
      )}
    </div>
  )

  const cartTotals = (
    <>
      <div className="space-y-3 text-sm">
        <div className="flex items-center justify-between text-foreground-muted">
          <span>Subtotal</span>
          <span className="font-mono text-foreground">{formatEth(subtotalEth)}</span>
        </div>
        <div className="flex items-center justify-between text-foreground-muted">
          <span>{couponCode ? 'Desconto do cupom' : 'Desconto do lançamento'}</span>
          <span className="font-mono text-foreground">(-) {formatEth(discountEth)}</span>
        </div>
        <div className="flex items-start justify-between text-foreground-muted">
          <span>Taxa de rede</span>
          <span className="text-right">
            <span className="block font-mono text-foreground">{formatEth(gasFeeEth)}</span>
            <span className="block text-[10px] text-primary">Taxa estimada</span>
          </span>
        </div>
        <div className="flex items-center justify-between pt-3 font-bold text-foreground">
          <span>Total</span>
          <span className="font-mono text-lg text-primary md:text-base">{formatEth(totalEth)}</span>
        </div>
      </div>
      <Link to="/checkout" className="block">
        <Button className="h-[58px] w-full rounded-full font-bold text-sm text-[#140D0A] md:h-11 md:rounded-sm">
          Conectar e finalizar
        </Button>
      </Link>
    </>
  )

  return (
    <div className="mx-auto w-full max-w-[1200px] px-7 pb-10 pt-0 md:px-6 md:pt-7 xl:px-0">
      {/* The mobile reference is a focused, full-screen cart with its own header. */}
      <header className="-mx-7 flex h-[72px] items-center justify-between px-7 md:hidden">
        <Link
          to="/"
          aria-label="Voltar ao mercado"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-primary/20 bg-surface text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-lg font-bold text-foreground">Carrinho de NFTs</h1>
        <span className="h-9 w-9" aria-hidden="true" />
      </header>

      <nav aria-label="Breadcrumb" className="hidden items-center gap-2 text-sm font-semibold text-foreground md:flex">
        <Link to="/" className="hover:text-primary">Início</Link>
        <span>/</span>
        <Link to="/" className="hover:text-primary">Mercado</Link>
        <span>/</span>
        <span>Carrinho NFTs</span>
      </nav>

      {items.length === 0 ? (
        <div className="mx-auto mt-8 max-w-2xl space-y-5 rounded-2xl border border-border bg-surface/50 p-8 py-16 text-center shadow-xl md:mt-12">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-primary">
            <ShoppingCart className="h-10 w-10" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Seu carrinho está vazio</h2>
          <p className="mx-auto max-w-md text-sm leading-relaxed text-foreground-muted">
            Explore nossa galeria de arte digital e selecione as melhores obras exclusivas para a sua coleção.
          </p>
          <Link to="/">
            <Button size="lg" className="mt-2 gap-2 font-bold">
              Explorar Catálogo <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 items-start gap-8 md:mt-5 lg:grid-cols-[minmax(0,1fr)_332px] lg:gap-[86px]">
            <section aria-label="Itens no carrinho" className="space-y-2 md:space-y-3">
              <div className="hidden grid-cols-[39.8%_17.7%_17.4%_19.6%_5.5%] items-center border-b border-border px-0 pb-2 text-sm font-bold text-foreground md:grid">
                <span>NFTs</span>
                <span>Preço</span>
                <span className="text-center">Edições</span>
                <span>Total</span>
                <span />
              </div>
              <div className="space-y-2.5 md:space-y-3">
                {items.map((item) => (
                  <article
                    key={item.nftId}
                    className="relative grid h-[100px] grid-cols-[92px_minmax(0,1fr)_76px] items-center gap-2 rounded-2xl bg-surface px-2 md:h-[70px] md:grid-cols-[39.8%_17.7%_17.4%_19.6%_5.5%] md:gap-0 md:rounded-none md:bg-[#241612] md:px-0"
                  >
                    <Link
                      to="/nft/$nftId"
                      params={{ nftId: item.nftId }}
                      className="h-[84px] w-[84px] overflow-hidden rounded-xl bg-surface-tertiary md:flex md:h-[70px] md:w-auto md:items-center md:gap-4 md:overflow-visible md:rounded-none md:bg-transparent"
                    >
                      <img src={item.nft.image} alt={item.nft.name} className="h-full w-full rounded-xl object-cover md:h-[70px] md:w-[70px]" />
                      <span className="hidden min-w-0 md:block">
                        <span className="block truncate text-sm font-bold text-foreground">{item.nft.name}</span>
                        <span className="mt-0.5 block truncate text-xs text-foreground-muted">ID do token: {item.nft.edition}</span>
                      </span>
                    </Link>

                    <div className="min-w-0 md:hidden">
                      <Link to="/nft/$nftId" params={{ nftId: item.nftId }} className="block truncate text-sm font-bold text-foreground">
                        {item.nft.name}
                      </Link>
                      <span className="mt-0.5 block truncate text-xs text-foreground-muted">Edição: {item.nft.edition.replace(/^#/, '')}</span>
                      <span className="mt-2 block font-mono text-base font-bold text-primary">{formatEth(item.nft.price)}</span>
                    </div>
                    <span className="hidden font-mono text-sm font-semibold text-foreground-muted md:block">{formatEth(item.nft.price)}</span>

                    <div className="flex items-center justify-end gap-1.5 md:justify-start md:gap-1.5">
                      <button
                        onClick={() => updateQuantity(item.nftId, item.quantity - 1)}
                        className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-background hover:brightness-110 disabled:opacity-40 md:h-7 md:w-7"
                        aria-label="Diminuir quantidade"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="min-w-[14px] text-center font-mono text-sm text-foreground">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.nftId, item.quantity + 1)}
                        disabled={item.quantity >= item.nft.availableSupply}
                        className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-background hover:brightness-110 disabled:opacity-40 md:h-7 md:w-7"
                        aria-label="Aumentar quantidade"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>

                    <span className="hidden whitespace-nowrap font-mono text-sm font-bold text-primary md:block">
                      {formatEth(new Decimal(item.unitPrice).times(item.quantity).toFixed(4))}
                    </span>
                    <button
                      onClick={() => removeFromCart(item.nftId)}
                      className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center text-foreground-muted hover:text-primary md:static md:h-8 md:w-8"
                      aria-label={`Remover ${item.nft.name} do carrinho`}
                    >
                      <Trash2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
                    </button>
                  </article>
                ))}
              </div>
            </section>

            <aside className="hidden space-y-6 lg:sticky lg:top-8 lg:block">
              <div className="space-y-5">
                <h2 className="border-b border-border pb-2 text-lg font-bold text-foreground">Resumo da carteira</h2>
                {couponForm}
                {cartTotals}
                <Link to="/" className="block text-center text-sm text-primary hover:underline">Continuar explorando</Link>
              </div>
            </aside>
          </div>

          {/* On small screens the checkout summary stays anchored like the reference. */}
          <div className="fixed inset-x-0 bottom-0 z-30 max-h-[48vh] overflow-y-auto rounded-t-[32px] border-t border-border bg-surface px-6 pb-8 pt-6 shadow-[0_-12px_32px_rgba(0,0,0,0.28)] md:hidden">
            <div className="space-y-3">
              <form onSubmit={handleApply} className="flex gap-0">
                <Input
                  aria-label="Código promocional"
                  placeholder="Digite o código promocional..."
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  className="h-12 min-w-0 rounded-l-full rounded-r-none border-primary/40 bg-background text-xs font-mono"
                />
                <Button type="submit" isLoading={isApplyingCoupon} className="h-12 rounded-l-none rounded-r-full px-5 text-xs font-bold">
                  Aplicar
                </Button>
              </form>
              {couponMessage && <p className="text-xs text-emerald-400">{couponMessage}</p>}
              {couponError && <p className="text-xs text-red-400">{couponError}</p>}
              {couponCode && discountPercent > 0 && (
                <div className="flex justify-between text-xs text-emerald-400">
                  <span>{couponCode} (-{discountPercent}%)</span>
                  <button onClick={removeCoupon} className="underline">Remover</button>
                </div>
              )}
              {cartTotals}
            </div>
          </div>

          <section className="mt-10 hidden space-y-5 pb-6 md:mt-24 md:block md:pb-0" aria-labelledby="recommendations-heading">
            <h2 id="recommendations-heading" className="border-b border-border pb-2 text-base font-bold text-primary md:text-lg">
              Colecionadores também viram
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 lg:gap-6">
              {recommendedNFTs.map((nft) => (
                <article key={nft.id} className="bg-[#241612] p-3">
                  <Link to="/nft/$nftId" params={{ nftId: nft.id }} className="block overflow-hidden rounded-2xl bg-surface-secondary">
                    <img src={nft.image} alt={nft.name} loading="lazy" className="aspect-[0.83] w-full object-cover" />
                  </Link>
                  <Link to="/nft/$nftId" params={{ nftId: nft.id }} className="mt-3 block truncate text-sm text-foreground hover:text-primary">
                    {nft.name}
                  </Link>
                  <p className="mt-1 font-mono text-sm font-bold text-primary">{formatEth(nft.price)}</p>
                </article>
              ))}
            </div>
          </section>
          <div className="h-[350px] md:hidden" aria-hidden="true" />
        </>
      )}
    </div>
  )
}
