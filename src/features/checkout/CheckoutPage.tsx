import React, { useState, useId, useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useCart } from '@/features/cart/CartContext'
import { useAuth } from '@/features/auth/AuthContext'
import { useRealtime } from '@/realtime/RealtimeContext'
import { Button } from '@/components/ui/Button'
import { formatEth, formatUsdEquivalent } from '@/lib/eth'
import { WalletProvider, NetworkId, OrderReceipt } from '@/types'
import { api } from '@/lib/api'
import {
  ShieldCheck,
  Wallet as WalletIcon,
  AlertTriangle,
  Lock,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Copy,
  Receipt,
  Download,
  ExternalLink,
} from 'lucide-react'
import confetti from 'canvas-confetti'

const WALLETS: Array<{ id: WalletProvider; name: string; icon: string }> = [
  { id: 'metamask', name: 'MetaMask', icon: '🦊' },
  { id: 'coinbase', name: 'Coinbase Wallet', icon: '🔵' },
  { id: 'rainbow', name: 'Rainbow', icon: '🌈' },
  { id: 'walletconnect', name: 'WalletConnect', icon: '⚡' },
]

const NETWORKS: Array<{ id: NetworkId; name: string; chainId: number }> = [
  { id: 'mainnet', name: 'Ethereum Mainnet', chainId: 1 },
  { id: 'sepolia', name: 'Sepolia Testnet', chainId: 11155111 },
  { id: 'arbitrum', name: 'Arbitrum One', chainId: 42161 },
  { id: 'polygon', name: 'Polygon PoS', chainId: 137 },
]

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate()
  const { user, isAuthenticated, isLoading, setAuthModalOpen, setRedirectAfterAuth } = useAuth()
  const { items, subtotalEth, discountEth, gasFeeEth, totalEth, couponCode, quoteData, fetchQuote } = useCart()
  const { priceAlerts, clearAllPriceAlerts } = useRealtime()

  // Payment configuration states
  const [selectedWallet, setSelectedWallet] = useState<WalletProvider>('metamask')
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkId>('mainnet')
  const [walletAddress] = useState<string>('0x71C8A392A0b0A31D084F59f71c4c92A3E4E392A')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [simulateFailure, setSimulateFailure] = useState(false)

  // Outdated quote / Price change lock
  const [quoteAccepted, setQuoteAccepted] = useState(true)
  const [hasPriceMismatch, setHasPriceMismatch] = useState(false)

  // Confirmed Order receipt state
  const [confirmedOrder, setConfirmedOrder] = useState<OrderReceipt | null>(null)
  const [copiedTx, setCopiedTx] = useState(false)

  // Stable Idempotency Key per checkout attempt session
  const defaultId = useId()
  const [idempotencyKey, setIdempotencyKey] = useState<string>(() => `idem-${Date.now()}-${defaultId.replace(/[^a-zA-Z0-9]/g, '')}`)

  // Redirect to login if user is unauthenticated
  useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated) {
      setRedirectAfterAuth('/checkout')
      setAuthModalOpen(true)
    }
  }, [isLoading, isAuthenticated, setAuthModalOpen, setRedirectAfterAuth])

  // Watch for real-time price alerts affecting items currently in cart
  useEffect(() => {
    if (priceAlerts.length > 0) {
      const affectedInCart = items.some((item) =>
        priceAlerts.some((alert) => alert.nftId === item.nftId)
      )
      if (affectedInCart) {
        setHasPriceMismatch(true)
        setQuoteAccepted(false)
      }
    }
  }, [priceAlerts, items])

  const handleReviewAndAcceptNewQuote = async () => {
    await fetchQuote()
    clearAllPriceAlerts()
    setHasPriceMismatch(false)
    setQuoteAccepted(true)
    // Refresh idempotency key because cart values changed
    setIdempotencyKey(`idem-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`)
  }

  const handleConfirmPayment = async () => {
    if (!isAuthenticated || !user) {
      setAuthModalOpen(true)
      return
    }

    if (items.length === 0) {
      setErrorMessage('Seu carrinho está vazio.')
      return
    }

    if (hasPriceMismatch || !quoteAccepted) {
      setErrorMessage('Por favor, aceite a nova cotação atualizada antes de prosseguir com o pagamento.')
      return
    }

    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      const payload = {
        idempotencyKey,
        items: items.map((i) => ({ nftId: i.nftId, quantity: i.quantity })),
        couponCode: couponCode || undefined,
        walletAddress,
        network: selectedNetwork,
        acceptedQuoteId: quoteData?.quoteId || 'quote-direct',
        simulateFailure,
      }

      const response = await api.post<OrderReceipt>('/orders', payload)
      const order = response.data

      // Mandatory check: Never confirm without success status from simulated API
      if (order && (order.status === 'confirmed' || response.status === 200 || response.status === 201)) {
        setConfirmedOrder(order)
        // Fire celebration confetti
        try {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#D08848', '#10B981', '#F59E0B'],
          })
        } catch {
          // ignore
        }
      }
    } catch (err: unknown) {
      const msg = (err as Error).message || 'Falha no processamento do pagamento.'
      setErrorMessage(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const copyTxHash = () => {
    if (confirmedOrder?.txHash) {
      navigator.clipboard.writeText(confirmedOrder.txHash)
      setCopiedTx(true)
      setTimeout(() => setCopiedTx(false), 2000)
    }
  }

  // If purchase confirmed, render immutable receipt screen!
  if (confirmedOrder) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8 shadow-2xl space-y-6">
          {/* Header with success badge */}
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground">
              Pedido Confirmado com Sucesso!
            </h1>
            <p className="text-xs sm:text-sm text-foreground-muted">
              Sua transação foi registrada na blockchain Ethereum e os NFTs foram transferidos para sua carteira.
            </p>
          </div>

          {/* Receipt Card with immutable snapshot */}
          <div className="p-5 rounded-xl border border-border bg-surface-secondary/40 space-y-4 text-xs">
            <div className="flex justify-between items-center pb-3 border-b border-border/60">
              <span className="text-foreground-muted">Identificador do Pedido:</span>
              <span className="font-mono font-bold text-foreground">{confirmedOrder.orderId}</span>
            </div>

            <div className="flex justify-between items-center pb-3 border-b border-border/60">
              <span className="text-foreground-muted">Chave de Idempotência:</span>
              <span className="font-mono text-[11px] text-foreground-muted">{confirmedOrder.idempotencyKey}</span>
            </div>

            <div className="flex justify-between items-center pb-3 border-b border-border/60">
              <span className="text-foreground-muted">Carteira Compradora:</span>
              <span className="font-mono text-foreground">{confirmedOrder.walletAddress}</span>
            </div>

            <div className="flex justify-between items-center pb-3 border-b border-border/60">
              <span className="text-foreground-muted">Rede:</span>
              <span className="font-semibold text-primary uppercase">{confirmedOrder.network}</span>
            </div>

            {/* Blockchain Tx Hash with copy button */}
            <div className="flex flex-col gap-1.5 pb-3 border-b border-border/60">
              <span className="text-foreground-muted">Hash da Transação (TX):</span>
              <div className="flex items-center justify-between p-2 rounded bg-surface border border-border font-mono text-[11px] text-primary break-all">
                <span>{confirmedOrder.txHash}</span>
                <div className="flex items-center gap-1.5 ml-2">
                  <button
                    onClick={copyTxHash}
                    className="p-1 hover:text-white transition-colors"
                    aria-label="Copiar Hash"
                    title="Copiar Hash da Transação"
                  >
                    {copiedTx ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <a
                    href={`https://etherscan.io/tx/${confirmedOrder.txHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1 hover:text-white transition-colors"
                    aria-label="Abrir no Etherscan (Simulado)"
                    title="Ver no Explorador de Blocos (Simulado)"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>

            {/* Immutable Items Snapshot */}
            <div className="space-y-3 pt-2">
              <span className="font-bold text-foreground uppercase tracking-wider text-[11px] block">
                Itens Adquiridos
              </span>
              {confirmedOrder.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-surface border border-border">
                  <div className="flex items-center gap-3">
                    <img src={item.image} alt={item.name} className="w-12 h-12 rounded object-cover bg-surface-tertiary" />
                    <div>
                      <strong className="text-foreground text-xs block">{item.name}</strong>
                      <span className="text-[11px] text-foreground-muted">Qtd: {item.quantity}</span>
                    </div>
                  </div>
                  <div className="text-right font-mono font-bold text-primary">
                    {formatEth(item.lineTotal)}
                  </div>
                </div>
              ))}
            </div>

            {/* Financial Summary */}
            <div className="pt-3 border-t border-border/80 space-y-1.5">
              <div className="flex justify-between text-foreground-muted">
                <span>Subtotal</span>
                <span className="font-mono">{formatEth(confirmedOrder.subtotal)}</span>
              </div>
              {confirmedOrder.discount !== '0.0000' && (
                <div className="flex justify-between text-emerald-400">
                  <span>Desconto Aplicado</span>
                  <span className="font-mono">- {formatEth(confirmedOrder.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-foreground-muted">
                <span>Taxa de Gás da Rede</span>
                <span className="font-mono">{formatEth(confirmedOrder.gasFee)}</span>
              </div>
              <div className="flex justify-between items-baseline pt-2 border-t border-border text-sm font-bold text-foreground">
                <span>Total Pago</span>
                <span className="font-mono text-base text-primary">{formatEth(confirmedOrder.total)}</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => window.print()}
              className="flex-1 gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Imprimir Recibo</span>
            </Button>
            <Button
              onClick={() => navigate({ to: '/' })}
              className="flex-1 font-bold"
            >
              Voltar ao Marketplace
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Breadcrumb */}
      <div>
        <button
          onClick={() => navigate({ to: '/' })}
          className="inline-flex items-center gap-2 text-xs font-semibold text-foreground-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Marketplace</span>
        </button>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground">Finalizar Compra & Pagamento</h1>
          <p className="text-xs sm:text-sm text-foreground-muted mt-1">
            Selecione sua carteira web3 e confirme a liquidação do pedido na blockchain.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-foreground-muted px-3 py-1.5 rounded-lg border border-border bg-surface">
          <Lock className="w-3.5 h-3.5 text-primary" />
          <span>Idempotência: {idempotencyKey.slice(0, 16)}...</span>
        </div>
      </div>

      {/* Real-time Outdated Quote Warning Banner */}
      {(hasPriceMismatch || !quoteAccepted) && (
        <div className="p-4 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-200 text-xs sm:text-sm space-y-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold text-amber-300">
                Alteração em tempo real detectada durante o checkout!
              </strong>
              <p className="mt-1 text-xs text-amber-200/90 leading-relaxed">
                O preço ou disponibilidade de um dos itens no seu pedido mudou na rede Ethereum via Socket.IO.
                Para sua segurança, a compra foi bloqueada até que você revise e aprove a nova cotação.
              </p>
            </div>
          </div>
          <div className="pt-1">
            <Button
              size="sm"
              onClick={handleReviewAndAcceptNewQuote}
              className="bg-amber-500 text-black hover:bg-amber-400 font-bold text-xs"
            >
              Revisar e Aceitar Nova Cotação
            </Button>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Wallet Selection & Network Settings */}
        <div className="lg:col-span-7 space-y-6">
          {/* Wallet Selector */}
          <div className="p-6 rounded-2xl border border-border bg-surface shadow-sm space-y-4">
            <div className="flex items-center gap-2 font-bold text-foreground text-sm">
              <WalletIcon className="w-4 h-4 text-primary" />
              <span>1. Escolha sua Carteira Web3</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {WALLETS.map((w) => (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => setSelectedWallet(w.id)}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border text-xs font-semibold transition-all text-left ${
                    selectedWallet === w.id
                      ? 'border-primary bg-primary/10 text-primary shadow-sm ring-1 ring-primary'
                      : 'border-border bg-surface-secondary/40 text-foreground hover:bg-surface-secondary'
                  }`}
                >
                  <span className="text-xl">{w.icon}</span>
                  <span>{w.name}</span>
                </button>
              ))}
            </div>

            <div className="pt-2 text-xs text-foreground-muted flex items-center justify-between bg-surface-secondary/40 p-3 rounded-lg border border-border/60">
              <span>Endereço de Origem:</span>
              <span className="font-mono text-foreground font-semibold">{walletAddress}</span>
            </div>
          </div>

          {/* Network Selector */}
          <div className="p-6 rounded-2xl border border-border bg-surface shadow-sm space-y-4">
            <div className="flex items-center gap-2 font-bold text-foreground text-sm">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span>2. Selecione a Rede Blockchain</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {NETWORKS.map((net) => (
                <button
                  key={net.id}
                  type="button"
                  onClick={() => setSelectedNetwork(net.id)}
                  className={`flex items-center justify-between p-3.5 rounded-xl border text-xs font-semibold transition-all ${
                    selectedNetwork === net.id
                      ? 'border-primary bg-primary/10 text-primary shadow-sm ring-1 ring-primary'
                      : 'border-border bg-surface-secondary/40 text-foreground hover:bg-surface-secondary'
                  }`}
                >
                  <span>{net.name}</span>
                  <span className="text-[10px] text-foreground-muted font-mono">ID {net.chainId}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Simulation Testing Toggle */}
          <div className="p-4 rounded-xl border border-border/60 bg-surface-secondary/20 text-xs flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="font-semibold text-foreground">Simular Falha de Pagamento</span>
              <p className="text-[11px] text-foreground-muted">
                Testa a preservação do carrinho e a mensagem de erro HTTP 402 da carteira.
              </p>
            </div>
            <input
              type="checkbox"
              checked={simulateFailure}
              onChange={(e) => setSimulateFailure(e.target.checked)}
              className="accent-primary w-4 h-4 cursor-pointer"
            />
          </div>
        </div>

        {/* Right Column: Order Review & Confirmation */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-2xl border border-border bg-surface shadow-xl space-y-6 sticky top-28">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-2 font-bold text-foreground text-sm">
                <Receipt className="w-4 h-4 text-primary" />
                <span>Revisão do Pedido</span>
              </div>
              <span className="text-xs text-foreground-muted font-mono">
                {items.length} {items.length === 1 ? 'item' : 'itens'}
              </span>
            </div>

            {/* Items list */}
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {items.map((item) => (
                <div
                  key={item.nftId}
                  className="flex items-center justify-between gap-3 p-2.5 rounded-lg border border-border/60 bg-surface-secondary/40 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={item.nft.image}
                      alt={item.nft.name}
                      className="w-10 h-10 rounded object-cover bg-surface-tertiary flex-shrink-0"
                    />
                    <div className="truncate">
                      <strong className="text-foreground block truncate">{item.nft.name}</strong>
                      <span className="text-[11px] text-foreground-muted">Qtd: {item.quantity}</span>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-primary whitespace-nowrap">
                    {formatEth(item.nft.price)}
                  </span>
                </div>
              ))}
            </div>

            {/* Financial Summary */}
            <div className="space-y-2 border-t border-border pt-4 text-xs">
              <div className="flex justify-between text-foreground-muted">
                <span>Subtotal</span>
                <span className="font-mono">{formatEth(subtotalEth)}</span>
              </div>
              {discountEth !== '0.0000' && (
                <div className="flex justify-between text-emerald-400">
                  <span>Desconto ({couponCode})</span>
                  <span className="font-mono">- {formatEth(discountEth)}</span>
                </div>
              )}
              <div className="flex justify-between text-foreground-muted">
                <span>Taxa de Gás da Rede</span>
                <span className="font-mono">{formatEth(gasFeeEth)}</span>
              </div>
              <div className="flex justify-between items-baseline pt-3 border-t border-border font-bold text-sm text-foreground">
                <span>Total a Pagar</span>
                <div className="text-right">
                  <div className="font-mono text-xl text-primary">{formatEth(totalEth)}</div>
                  <div className="text-[11px] text-foreground-muted font-normal">
                    ≈ {formatUsdEquivalent(totalEth)}
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Payment CTA */}
            <Button
              onClick={handleConfirmPayment}
              isLoading={isSubmitting}
              disabled={items.length === 0 || hasPriceMismatch || !quoteAccepted}
              size="lg"
              className="w-full font-extrabold text-base shadow-xl"
            >
              Confirmar Pagamento em ETH
            </Button>

            <p className="text-[11px] text-center text-foreground-muted leading-tight">
              Ao confirmar, você autoriza a simulação da transação com chave de idempotência exclusiva.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
