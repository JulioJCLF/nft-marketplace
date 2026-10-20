import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { useCart } from '@/features/cart/CartContext'
import { useAuth } from '@/features/auth/AuthContext'
import { useRealtime } from '@/realtime/RealtimeContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { formatEth } from '@/lib/eth'
import { Decimal } from 'decimal.js'
import { WalletProvider, NetworkId, OrderReceipt } from '@/types'
import { api } from '@/lib/api'
import {
  Wallet as WalletIcon,
  AlertTriangle,
  Lock,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  X,
} from 'lucide-react'
import confetti from 'canvas-confetti'

const WALLETS: Array<{ id: WalletProvider; name: string }> = [
  { id: 'metamask', name: 'MetaMask' },
  { id: 'coinbase', name: 'Coinbase Wallet' },
  { id: 'rainbow', name: 'Rainbow' },
  { id: 'walletconnect', name: 'WalletConnect' },
]

const NETWORKS: Array<{ id: NetworkId; name: string }> = [
  { id: 'mainnet', name: 'Ethereum Mainnet' },
  { id: 'sepolia', name: 'Sepolia Testnet' },
  { id: 'arbitrum', name: 'Arbitrum One' },
  { id: 'polygon', name: 'Polygon PoS' },
]

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user, isAuthenticated, isLoading, setAuthModalOpen, setRedirectAfterAuth } = useAuth()
  const { items, subtotalEth, discountEth, gasFeeEth, totalEth, couponCode, quoteData, fetchQuote } = useCart()
  const { priceAlerts, clearAllPriceAlerts, lastEvent } = useRealtime()

  // Payment configuration states
  const [selectedWallet, setSelectedWallet] = useState<WalletProvider>('metamask')
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkId>('mainnet')
  const [walletAddress, setWalletAddress] = useState('0x71C8A392A0b0A31D084F59f71c4c92A3E4E392A')
  const [useAnotherWallet, setUseAnotherWallet] = useState(false)
  const [profileFields, setProfileFields] = useState({
    username: '',
    profileName: '',
    secondaryWallet: '',
    referralCode: '',
    ensName: '',
    note: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [simulateFailure, setSimulateFailure] = useState(false)

  // Outdated quote / Price change lock
  const [quoteAccepted, setQuoteAccepted] = useState(true)
  const [hasPriceMismatch, setHasPriceMismatch] = useState(false)

  // Confirmed Order receipt state
  const [confirmedOrder, setConfirmedOrder] = useState<OrderReceipt | null>(null)
  const [copiedTx, setCopiedTx] = useState(false)

  // Retain the current attempt across reloads so an uncertain request can be reconciled.
  const [idempotencyKey, setIdempotencyKey] = useState<string>(() => `idem-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`)
  const pendingAttemptStorageKey = user ? `kurio-pending-order:${user.id}` : null
  const receiptStorageKey = user ? `kurio-confirmed-receipt:${user.id}` : null

  const markOrderConfirmed = useCallback((order: OrderReceipt, celebrate = true) => {
    setConfirmedOrder(order)
    if (receiptStorageKey) sessionStorage.setItem(receiptStorageKey, JSON.stringify(order))
    if (pendingAttemptStorageKey) localStorage.removeItem(pendingAttemptStorageKey)
    queryClient.invalidateQueries({ queryKey: ['cart'] })
    queryClient.invalidateQueries({ queryKey: ['quote'] })
    queryClient.invalidateQueries({ queryKey: ['orders'] })
    queryClient.invalidateQueries({ queryKey: ['nfts'] })

    if (celebrate) {
      try {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#D08848', '#10B981', '#F59E0B'] })
      } catch {
        // ignore
      }
    }
  }, [pendingAttemptStorageKey, queryClient, receiptStorageKey])

  useEffect(() => {
    if (!user || !pendingAttemptStorageKey || !receiptStorageKey) return

    const savedReceipt = sessionStorage.getItem(receiptStorageKey)
    if (savedReceipt) {
      try {
        const order = JSON.parse(savedReceipt) as OrderReceipt
        if (order.userId === user.id && order.status === 'confirmed') {
          setConfirmedOrder(order)
          return
        }
      } catch {
        sessionStorage.removeItem(receiptStorageKey)
      }
    }

    const savedAttempt = localStorage.getItem(pendingAttemptStorageKey)
    if (!savedAttempt) return
    try {
      const attempt = JSON.parse(savedAttempt) as { idempotencyKey?: string }
      if (!attempt.idempotencyKey) return
      setIdempotencyKey(attempt.idempotencyKey)
      api.get<OrderReceipt>(`/orders/by-idempotency/${encodeURIComponent(attempt.idempotencyKey)}`)
        .then(({ data }) => {
          if (data.userId !== user.id) return
          if (data.status === 'confirmed') markOrderConfirmed(data, false)
          else if (data.status === 'failed') {
            localStorage.removeItem(pendingAttemptStorageKey)
            setErrorMessage('O pagamento deste pedido foi recusado. Seus itens continuam no carrinho.')
          } else {
            localStorage.setItem(pendingAttemptStorageKey, JSON.stringify({ ...attempt, orderId: data.orderId }))
          }
        })
        .catch(() => {
          // A 404 means the server did not commit this attempt; keep its key for a safe retry.
        })
    } catch {
      localStorage.removeItem(pendingAttemptStorageKey)
    }
  }, [markOrderConfirmed, pendingAttemptStorageKey, receiptStorageKey, user])

  useEffect(() => {
    if (!user || !pendingAttemptStorageKey || !lastEvent || !('orderId' in lastEvent)) return
    const savedAttempt = localStorage.getItem(pendingAttemptStorageKey)
    if (!savedAttempt) return
    try {
      const attempt = JSON.parse(savedAttempt) as { orderId?: string }
      if (attempt.orderId !== lastEvent.orderId) return
    } catch {
      localStorage.removeItem(pendingAttemptStorageKey)
      return
    }

    api.get<OrderReceipt>(`/orders/${encodeURIComponent(lastEvent.orderId)}`)
      .then(({ data }) => {
        if (data.userId !== user.id) return
        if (data.status === 'confirmed') markOrderConfirmed(data)
        else if (data.status === 'failed') {
          localStorage.removeItem(pendingAttemptStorageKey)
          setErrorMessage('O pagamento foi recusado. Seus itens continuam no carrinho.')
        }
      })
      .catch(() => {
        setErrorMessage('Não foi possível atualizar o pedido agora. Tente novamente em instantes.')
      })
  }, [lastEvent, markOrderConfirmed, pendingAttemptStorageKey, user])

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
    if (pendingAttemptStorageKey) {
      const savedAttempt = localStorage.getItem(pendingAttemptStorageKey)
      if (savedAttempt) {
        try {
          const { idempotencyKey: pendingKey } = JSON.parse(savedAttempt) as { idempotencyKey?: string }
          if (pendingKey) {
            const { data } = await api.get<OrderReceipt>(`/orders/by-idempotency/${encodeURIComponent(pendingKey)}`)
            if (data.status === 'confirmed' && data.userId === user?.id) {
              markOrderConfirmed(data, false)
              return
            }
          }
        } catch {
          // No committed order was found; the user may proceed with a fresh quote.
        }
      }
      localStorage.removeItem(pendingAttemptStorageKey)
    }
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

      if (pendingAttemptStorageKey) {
        localStorage.setItem(pendingAttemptStorageKey, JSON.stringify({ idempotencyKey, createdAt: new Date().toISOString() }))
      }

      const response = await api.post<OrderReceipt>('/orders', payload)
      const order = response.data

      // Mandatory check: Never confirm without success status from simulated API
      if (order?.status === 'confirmed' && order.userId === user.id) {
        markOrderConfirmed(order)
      } else if (order?.status === 'pending' && order.userId === user.id && pendingAttemptStorageKey) {
        localStorage.setItem(pendingAttemptStorageKey, JSON.stringify({ idempotencyKey, orderId: order.orderId, createdAt: new Date().toISOString() }))
        setErrorMessage('Pagamento enviado e aguardando confirmação da rede.')
      }
    } catch (err: unknown) {
      const msg = (err as Error).message || 'Falha no processamento do pagamento.'
      const error = err as Error & { status?: number }
      try {
        const { data } = await api.get<OrderReceipt>(`/orders/by-idempotency/${encodeURIComponent(idempotencyKey)}`)
        if (data.status === 'confirmed' && data.userId === user.id) {
          markOrderConfirmed(data)
          return
        }
      } catch {
        if (error.status === 402 && pendingAttemptStorageKey) localStorage.removeItem(pendingAttemptStorageKey)
      }
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
    const transactionDate = new Date(confirmedOrder.confirmedAt || confirmedOrder.createdAt)
    const shortTransactionId = `0x${confirmedOrder.txHash.slice(2, 6).toUpperCase()}...${confirmedOrder.txHash.slice(-4).toUpperCase()}`
    const formattedTransactionDate = `${transactionDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}, ${transactionDate.getFullYear()}`
    const walletName = WALLETS.find((wallet) => wallet.id === selectedWallet)?.name ?? 'MetaMask'

    return (
      <div className="fixed inset-0 z-[60] flex min-h-full items-start justify-center overflow-y-auto bg-background px-4 py-8 sm:items-center sm:py-12">
        <article className="relative w-full max-w-[580px] border-b-[10px] border-primary bg-[#241612] px-6 pb-8 pt-6 shadow-2xl sm:px-11 sm:pb-10 sm:pt-7">
          <button
            type="button"
            onClick={() => {
              if (receiptStorageKey) sessionStorage.removeItem(receiptStorageKey)
              setConfirmedOrder(null)
              navigate({ to: '/' })
            }}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center text-primary transition-colors hover:text-foreground"
            aria-label="Fechar confirmação e voltar ao marketplace"
          >
            <X className="h-4 w-4" />
          </button>

          <header className="mb-5 flex flex-col items-center gap-0 text-center">
            <svg className="h-[96px] w-[88px] text-primary" viewBox="0 0 80 88" fill="none" aria-hidden="true">
              <path d="M28 12V9a6 6 0 0 1 6-6h12a6 6 0 0 1 6 6v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M13 28h54a5 5 0 0 1 5 5v43a5 5 0 0 1-5 5H13a5 5 0 0 1-5-5V33a5 5 0 0 1 5-5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
              <path d="m9 35 31 24 31-24M9 77l23-20m39 20L48 57" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
              <path d="M21 9h38v30H21z" fill="#241612" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
              <text x="40" y="21" fill="currentColor" textAnchor="middle" fontSize="10" fontWeight="700" fontFamily="monospace" letterSpacing="0.2">THANK</text>
              <text x="40" y="32" fill="currentColor" textAnchor="middle" fontSize="10" fontWeight="700" fontFamily="monospace" letterSpacing="0.2">YOU</text>
            </svg>
            <h1 className="-mt-3 text-base font-bold text-foreground-muted sm:text-lg">
              Seus NFTs agora estão na sua carteira
            </h1>
          </header>

          <div className="-mx-6 mb-5 grid grid-cols-2 border-y border-primary/70 px-6 py-3 text-xs sm:-mx-11 sm:grid-cols-[1.2fr_1.15fr_1.2fr_0.7fr] sm:px-9 sm:text-sm">
            <div className="border-r border-primary/60 pb-2 pr-3 sm:pb-0">
              <span className="block text-foreground-muted">ID da transação</span>
              <span data-testid="receipt-transaction-id" className="mt-0.5 block font-mono text-foreground">{shortTransactionId}</span>
            </div>
            <div className="pb-2 pl-3 sm:border-r sm:border-primary/60 sm:pb-0 sm:pr-3">
              <span className="block text-foreground-muted">Data</span>
              <span className="mt-0.5 block text-foreground">
                {formattedTransactionDate}
              </span>
            </div>
            <div className="border-r border-primary/60 pt-2 pr-3 sm:border-r sm:py-0 sm:pl-3">
              <span className="block text-foreground-muted">Total</span>
              <span className="mt-0.5 block font-mono text-foreground">{formatEth(confirmedOrder.total)}</span>
            </div>
            <div className="pt-2 pl-3 sm:py-0 sm:pl-3">
              <span className="block text-foreground-muted">Carteira</span>
              <span className="mt-0.5 block truncate font-mono text-foreground" title={confirmedOrder.walletAddress}>
                {walletName}
              </span>
            </div>
          </div>

          <section aria-labelledby="receipt-items-title" className="space-y-3">
            <h2 id="receipt-items-title" className="text-sm font-bold text-foreground sm:text-base">Detalhes da transação</h2>
            <div className="grid grid-cols-[minmax(0,1fr)_58px_88px] items-center border-b border-border pb-2 text-xs font-bold text-foreground sm:grid-cols-[minmax(0,1fr)_84px_96px] sm:text-base">
              <span>NFTs</span>
              <span className="text-center">Edições</span>
              <span className="text-right">Subtotal</span>
            </div>
            <div className="space-y-2.5">
              {confirmedOrder.items.map((item, idx) => {
                const tokenNumber = item.name.match(/#([\w-]+)$/)?.[1]
                return (
                  <div key={`${item.nftId}-${idx}`} className="grid grid-cols-[minmax(0,1fr)_58px_88px] items-center gap-1 sm:grid-cols-[minmax(0,1fr)_84px_96px] sm:gap-2">
                    <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
                      <img src={item.image} alt={item.name} className="h-14 w-14 shrink-0 rounded-lg bg-surface-tertiary object-cover sm:h-[70px] sm:w-[70px]" />
                      <div className="min-w-0">
                        <strong className="block truncate text-xs font-bold text-foreground sm:text-base">{item.name}</strong>
                        <span className="mt-0.5 block truncate text-[10px] text-foreground-muted sm:text-xs">
                          {tokenNumber ? `ID do token: #${tokenNumber}` : item.collection}
                        </span>
                      </div>
                    </div>
                    <span className="text-center font-mono text-[11px] text-foreground-muted sm:text-xs">(× {item.quantity})</span>
                    <span className="whitespace-nowrap text-right font-mono text-xs font-bold text-primary sm:text-base">{formatEth(item.lineTotal)}</span>
                  </div>
                )
              })}
            </div>
          </section>

          <div className="ml-auto mt-4 max-w-[245px] space-y-1.5 border-b border-border pb-2 text-xs sm:text-sm">
            <div className="flex justify-between gap-4 text-foreground-muted">
              <span>Taxa de rede</span>
              <span className="font-mono">{formatEth(confirmedOrder.gasFee)}</span>
            </div>
            <div className="flex justify-between gap-4 pt-1 font-bold text-foreground">
              <span>Total</span>
              <span className="font-mono text-primary">{formatEth(confirmedOrder.total)}</span>
            </div>
          </div>

          <p className="mx-auto mt-3 max-w-md text-center text-xs leading-relaxed text-foreground-muted">
            Transação confirmada na rede {confirmedOrder.network.toUpperCase()}. A propriedade foi transferida para sua carteira conectada e registrada na blockchain.
          </p>

          <div className="mt-4 flex flex-col items-center justify-center gap-2 sm:flex-row">
            <a
              href={`https://etherscan.io/tx/${confirmedOrder.txHash}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-[6px] bg-primary px-5 text-sm font-bold text-[#140D0A] transition-colors hover:bg-primary-hover"
              aria-label="Abrir no Etherscan (Simulado)"
            >
              Ver no Etherscan <ExternalLink className="h-4 w-4" />
            </a>
            <div className="flex items-center gap-4 text-[11px] text-foreground-muted">
              <button onClick={copyTxHash} className="inline-flex items-center gap-1 hover:text-foreground" aria-label="Copiar Hash" title="Copiar Hash da Transação">
                {copiedTx ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                Copiar ID
              </button>
            </div>
          </div>
        </article>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[1200px] px-7 pb-52 pt-0 md:px-6 md:pb-10 md:pt-7 xl:px-0">
      <header className="-mx-7 flex h-[72px] items-center justify-between px-7 md:hidden">
        <button
          onClick={() => navigate({ to: '/cart' })}
          aria-label="Voltar ao carrinho"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-primary/20 bg-surface text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="text-lg font-bold text-foreground">Pagamento com carteira</h1>
        <span className="h-9 w-9" aria-hidden="true" />
      </header>

      <nav aria-label="Breadcrumb" className="hidden items-center gap-2 text-sm font-semibold text-foreground md:flex">
        <button
          onClick={() => navigate({ to: '/' })}
          className="hover:text-primary"
        >
          Início
        </button>
        <span>/</span>
        <button onClick={() => navigate({ to: '/' })} className="hover:text-primary">Mercado</button>
        <span>/</span>
        <span>Pagamento</span>
      </nav>

      <h1 className="sr-only">Finalizar Compra &amp; Pagamento</h1>
      <span className="sr-only"><Lock className="h-3.5 w-3.5" /> Idempotência: {idempotencyKey}</span>

      {/* Real-time Outdated Quote Warning Banner */}
      {(hasPriceMismatch || !quoteAccepted) && (
        <Alert variant="warning" className="block space-y-3 p-4 text-xs sm:text-sm">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <AlertTitle className="mb-0 font-bold text-amber-300 leading-normal">
                Alteração em tempo real detectada durante o checkout!
              </AlertTitle>
              <AlertDescription className="mt-1 text-xs text-amber-200/90 leading-relaxed">
                O preço ou disponibilidade de um dos itens no seu pedido mudou na rede Ethereum via Socket.IO.
                Para sua segurança, a compra foi bloqueada até que você revise e aprove a nova cotação.
              </AlertDescription>
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
        </Alert>
      )}

      {errorMessage && (
        <Alert variant="destructive">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 items-start gap-8 md:mt-7 lg:grid-cols-[minmax(0,1fr)_405px] lg:gap-8">
        <section className="order-2 hidden space-y-6 md:order-1 md:block" aria-labelledby="collector-profile-heading">
          <div className="space-y-4">
            <h2 id="collector-profile-heading" className="border-b border-border pb-2 text-lg font-bold text-foreground">Perfil do colecionador</h2>
            <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              <label className="space-y-1.5 text-xs text-foreground">
                <span className="block">Nome de exibição<span className="text-primary">*</span></span>
                <Input value={user?.name ?? ''} readOnly className="h-10 rounded-none border-border bg-transparent px-3 py-0 text-xs text-foreground-muted focus-visible:ring-0 focus-visible:border-border" />
              </label>
              <label className="space-y-1.5 text-xs text-foreground">
                <span className="block">Nome de usuário<span className="text-primary">*</span></span>
                <Input value={profileFields.username} onChange={(e) => setProfileFields((fields) => ({ ...fields, username: e.target.value }))} className="h-10 rounded-none border-border bg-transparent px-3 py-0 text-xs text-foreground focus-visible:ring-0 focus-visible:border-primary" />
              </label>

              <label className="space-y-1.5 text-xs text-foreground">
                <span className="block">Rede<span className="text-primary">*</span></span>
                <select
                  aria-label="Rede"
                  value={selectedNetwork}
                  onChange={(e) => setSelectedNetwork(e.target.value as NetworkId)}
                  className="h-10 w-full border border-border bg-background px-3 text-xs text-foreground outline-none focus:border-primary"
                >
                  {NETWORKS.map((net) => <option key={net.id} value={net.id}>{net.name}</option>)}
                </select>
              </label>
              <label className="space-y-1.5 text-xs text-foreground">
                <span className="block">Nome do perfil<span className="text-primary">*</span></span>
                <Input value={profileFields.profileName} onChange={(e) => setProfileFields((fields) => ({ ...fields, profileName: e.target.value }))} className="h-10 rounded-none border-border bg-transparent px-3 py-0 text-xs text-foreground focus-visible:ring-0 focus-visible:border-primary" />
              </label>

              <label className="space-y-1.5 text-xs text-foreground">
                <span className="block">Endereço da carteira<span className="text-primary">*</span></span>
                <Input value={walletAddress} onChange={(e) => setWalletAddress(e.target.value)} readOnly={!useAnotherWallet} className="h-10 rounded-none border-border bg-transparent px-3 py-0 font-mono text-[10px] text-foreground-muted read-only:opacity-80 focus-visible:ring-0 focus-visible:border-primary" />
              </label>
              <label className="space-y-1.5 text-xs text-foreground">
                <span className="block">ENS ou carteira secundária (opcional)</span>
                <Input value={profileFields.secondaryWallet} onChange={(e) => setProfileFields((fields) => ({ ...fields, secondaryWallet: e.target.value }))} className="h-10 rounded-none border-border bg-transparent px-3 py-0 text-xs text-foreground focus-visible:ring-0 focus-visible:border-primary" />
              </label>

              <label className="space-y-1.5 text-xs text-foreground">
                <span className="block">Tipo de carteira<span className="text-primary">*</span></span>
                <div className="flex h-10 items-center border border-border px-3 text-xs text-foreground-muted">{WALLETS.find((wallet) => wallet.id === selectedWallet)?.name}</div>
              </label>
              <label className="space-y-1.5 text-xs text-foreground">
                <span className="block">Código de indicação<span className="text-primary">*</span></span>
                <Input value={profileFields.referralCode} onChange={(e) => setProfileFields((fields) => ({ ...fields, referralCode: e.target.value }))} className="h-10 rounded-none border-border bg-transparent px-3 py-0 text-xs text-foreground focus-visible:ring-0 focus-visible:border-primary" />
              </label>

              <label className="space-y-1.5 text-xs text-foreground">
                <span className="block">E-mail<span className="text-primary">*</span></span>
                <Input value={user?.email ?? ''} readOnly className="h-10 rounded-none border-border bg-transparent px-3 py-0 text-xs text-foreground-muted focus-visible:ring-0 focus-visible:border-border" />
              </label>
              <label className="space-y-1.5 text-xs text-foreground">
                <span className="block">Nome ENS<span className="text-primary">*</span></span>
                <div className="flex h-10">
                  <Input value={profileFields.ensName} onChange={(e) => setProfileFields((fields) => ({ ...fields, ensName: e.target.value }))} className="h-10 min-w-0 rounded-none border-border bg-transparent px-3 py-0 text-xs text-foreground focus-visible:ring-0 focus-visible:border-primary" />
                  <span className="flex items-center border border-l-0 border-border px-3 text-xs text-foreground-muted">.eth</span>
                </div>
              </label>
            </div>

            <label className="flex items-center gap-2 text-xs text-foreground">
              <input type="radio" name="wallet-address-mode" checked={useAnotherWallet} onChange={() => setUseAnotherWallet(true)} className="h-4 w-4 accent-primary" />
              <span>Usar outra carteira?</span>
            </label>
            <label className="block space-y-1.5 text-xs text-foreground">
              <span>Observação do colecionador (opcional)</span>
              <textarea value={profileFields.note} onChange={(e) => setProfileFields((fields) => ({ ...fields, note: e.target.value }))} className="h-24 w-full resize-none border border-border bg-transparent p-3 text-xs text-foreground outline-none focus:border-primary" />
            </label>
          </div>

        </section>

        <aside className="order-1 space-y-5 md:order-2 lg:sticky lg:top-8" aria-labelledby="order-summary-heading">
          <div className="flex flex-col gap-4 space-y-0 md:block md:space-y-5">
            <div className="order-3 grid grid-cols-[minmax(0,1fr)_auto] items-end border-b border-border pb-2 text-sm font-bold text-foreground md:order-none">
              <div>
                <h2 id="order-summary-heading" className="text-lg">Seus NFTs</h2>
                <span className="text-[10px] font-normal text-foreground-muted">Revisão do Pedido</span>
              </div>
              <span>Subtotal</span>
            </div>

            {/* Items list */}
            <div className="order-4 max-h-60 space-y-2.5 overflow-y-auto md:order-none">
              {items.map((item) => (
                <div
                  key={item.nftId}
                  className="grid grid-cols-[68px_minmax(0,1fr)_auto_auto] items-center gap-3 bg-[#241612] pr-3 text-xs"
                >
                  <img
                    src={item.nft.image}
                    alt={item.nft.name}
                    className="h-[68px] w-[68px] flex-shrink-0 object-cover"
                  />
                  <div className="min-w-0 truncate">
                    <strong className="block truncate text-foreground">{item.nft.name}</strong>
                    <span className="text-[11px] text-foreground-muted">ID do token: {item.nft.edition}</span>
                  </div>
                  <span className="font-mono font-bold text-primary whitespace-nowrap">
                    (× {item.quantity})
                  </span>
                  <span className="font-mono font-bold text-primary whitespace-nowrap">
                    {formatEth(new Decimal(item.unitPrice).times(item.quantity).toFixed(4))}
                  </span>
                </div>
              ))}
            </div>

            <p className="hidden items-center justify-between border-b border-border pb-3 text-xs text-foreground-muted md:flex">
              <span>Tem um código promocional?</span>
              <button onClick={() => navigate({ to: '/cart' })} className="font-semibold text-primary hover:underline">
                Aplique no carrinho
              </button>
            </p>

            {/* Financial Summary */}
            <div className="hidden space-y-3 text-sm md:block">
              <div className="flex justify-between text-foreground-muted">
                <span>Subtotal</span>
                <span className="font-mono text-foreground">{formatEth(subtotalEth)}</span>
              </div>
              <div className="flex justify-between text-foreground-muted">
                <span>Desconto do lançamento</span>
                <span className="font-mono text-foreground">(-) {formatEth(discountEth)}</span>
              </div>
              <div className="flex justify-between text-foreground-muted">
                <span>Taxa de rede</span>
                <span className="text-right">
                  <span className="block font-mono text-foreground">{formatEth(gasFeeEth)}</span>
                  <span className="block text-[10px] text-primary">Taxa estimada</span>
                </span>
              </div>
              <div className="flex items-baseline justify-between pt-2 font-bold text-foreground">
                <span>Total</span>
                <span className="font-mono text-lg text-primary">{formatEth(totalEth)}</span>
              </div>
            </div>

            <div className="order-1 space-y-3 border-t border-border pt-4 md:order-none">
              <h3 className="text-center text-sm font-bold text-foreground">Carteira e rede</h3>
              <div className="space-y-2">
                {WALLETS.map((wallet) => (
                  <button
                    key={wallet.id}
                    type="button"
                    onClick={() => setSelectedWallet(wallet.id)}
                    aria-pressed={selectedWallet === wallet.id}
                    className={`flex w-full items-center gap-3 rounded-sm border px-3 py-2.5 text-left text-xs transition-colors ${selectedWallet === wallet.id ? 'border-primary text-foreground' : 'border-border text-foreground hover:border-primary/60'}`}
                  >
                    <span className={`h-4 w-4 rounded-full border ${selectedWallet === wallet.id ? 'border-primary after:mx-auto after:mt-[3px] after:block after:h-2 after:w-2 after:rounded-full after:bg-primary' : 'border-primary/60'}`} />
                    <span className="flex h-7 w-7 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-primary" aria-hidden="true">
                      <WalletIcon className="h-3.5 w-3.5" />
                    </span>
                    <span>{wallet.name}</span>
                  </button>
                ))}
              </div>
              <p className="text-center font-mono text-[10px] text-foreground-muted">{walletAddress}</p>
            </div>

            <label className="order-2 space-y-2 md:hidden">
              <span className="block text-sm font-bold text-foreground">Rede</span>
              <select
                aria-label="Rede"
                value={selectedNetwork}
                onChange={(e) => setSelectedNetwork(e.target.value as NetworkId)}
                className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-xs text-foreground outline-none focus:border-primary"
              >
                {NETWORKS.map((net) => <option key={net.id} value={net.id}>{net.name}</option>)}
              </select>
            </label>

            <div className="order-5 flex items-center justify-between border-t border-border pt-3 text-xs md:order-none">
              <div className="space-y-0.5">
                <span className="font-semibold text-foreground">Simular Falha de Pagamento</span>
                <p className="text-[11px] text-foreground-muted">Teste local da recusa da carteira.</p>
              </div>
              <input
                type="checkbox"
                checked={simulateFailure}
                onChange={(e) => setSimulateFailure(e.target.checked)}
                className="h-4 w-4 cursor-pointer accent-primary"
              />
            </div>

            {/* Submit Payment CTA */}
            <Button
              onClick={handleConfirmPayment}
              isLoading={isSubmitting}
              disabled={items.length === 0 || hasPriceMismatch || !quoteAccepted}
              aria-label="Confirmar Pagamento em ETH"
              className="hidden h-11 w-full rounded-sm font-bold text-[#140D0A] md:inline-flex"
            >
              Confirmar compra
            </Button>

            <p className="hidden text-center text-[10px] leading-tight text-foreground-muted md:block">
              Pagamento protegido. Idempotência: {idempotencyKey.slice(0, 16)}...
            </p>
          </div>
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface px-7 pb-8 pt-4 md:hidden">
        <div className="mb-3 flex items-center justify-between font-bold text-foreground">
          <span>Total:</span>
          <span className="font-mono text-lg text-primary">{formatEth(totalEth)}</span>
        </div>
        <Button
          onClick={handleConfirmPayment}
          isLoading={isSubmitting}
          disabled={items.length === 0 || hasPriceMismatch || !quoteAccepted}
          aria-label="Confirmar Pagamento em ETH"
          className="h-14 w-full rounded-full font-bold text-[#140D0A]"
        >
          Confirmar compra
        </Button>
      </div>
    </div>
  )
}
