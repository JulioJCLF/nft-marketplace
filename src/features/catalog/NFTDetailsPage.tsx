import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { NFT, CatalogResponse } from '@/types'
import { INITIAL_NFTS } from '@/mocks/fixtures'
import { formatEth, truncateAddress, formatDate } from '@/lib/eth'
import { useCart } from '@/features/cart/CartContext'
import { useAuth } from '@/features/auth/AuthContext'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { NFTCard } from './NFTCard'
import {
  Heart,
  ShoppingCart,
  ArrowLeft,
  AlertCircle,
  Plus,
  Minus,
  Star,
  Copy,
} from 'lucide-react'
import { Link, useNavigate } from '@tanstack/react-router'
import { getNFTImageSrcSet } from '@/lib/nftImage'

interface NFTDetailsPageProps {
  nftId: string
}

export const NFTDetailsPage: React.FC<NFTDetailsPageProps> = ({ nftId }) => {
  const navigate = useNavigate()
  const { addToCart, setIsCartDrawerOpen } = useCart()
  const { isAuthenticated, setAuthModalOpen } = useAuth()
  const queryClient = useQueryClient()

  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [quantity, setQuantity] = useState<number>(1)
  const [activeTab, setActiveTab] = useState<'traits' | 'history' | 'details' | 'reviews'>('details')
  const [isAddedFeedback, setIsAddedFeedback] = useState(false)
  const [shareLinkCopied, setShareLinkCopied] = useState(false)

  // Fetch NFT Details
  const {
    data: nft,
    isLoading,
    isError,
    error,
  } = useQuery<NFT>({
    queryKey: ['nft', nftId],
    queryFn: async () => {
      const response = await api.get<NFT>(`/nfts/${nftId}`)
      return response.data
    },
    staleTime: 1000 * 30,
    placeholderData: () => INITIAL_NFTS.find((item) => item.id === nftId),
  })

  // Fetch Recommended NFTs from same collection
  const { data: recommendedData } = useQuery<CatalogResponse>({
    queryKey: ['nfts', { limit: 6 }],
    queryFn: async () => {
      const response = await api.get<CatalogResponse>('/nfts?limit=6')
      return response.data
    },
    staleTime: 1000 * 60,
  })

  // Optimistic Favorite Mutation
  const favoriteMutation = useMutation({
    mutationFn: async ({ isCurrentlyLiked }: { isCurrentlyLiked: boolean }) => {
      if (isCurrentlyLiked) {
        await api.delete(`/favorites/${nftId}`)
      } else {
        await api.post(`/favorites/${nftId}`)
      }
    },
    onMutate: async ({ isCurrentlyLiked }) => {
      await queryClient.cancelQueries({ queryKey: ['nft', nftId] })
      const previous = queryClient.getQueryData<NFT>(['nft', nftId])

      if (previous) {
        queryClient.setQueryData<NFT>(['nft', nftId], {
          ...previous,
          isLiked: !isCurrentlyLiked,
          likes: isCurrentlyLiked ? Math.max(0, previous.likes - 1) : previous.likes + 1,
        })
      }
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['nft', nftId], context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] })
      queryClient.invalidateQueries({ queryKey: ['nfts'] })
    },
  })

  const handleToggleFavorite = () => {
    if (!isAuthenticated) {
      setAuthModalOpen(true)
      return
    }
    if (nft) {
      favoriteMutation.mutate({ isCurrentlyLiked: !!nft.isLiked })
    }
  }

  const handleShare = (platform: 'x' | 'facebook' | 'whatsapp') => {
    const url = window.location.href
    const text = `Confira ${nft?.name ?? 'este NFT'} na Kurio`
    const shareUrls = {
      x: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`,
    }
    window.open(shareUrls[platform], '_blank', 'noopener,noreferrer')
  }

  const handleCopyShareLink = async () => {
    await navigator.clipboard.writeText(window.location.href)
    setShareLinkCopied(true)
    window.setTimeout(() => setShareLinkCopied(false), 2000)
  }

  const handleAddToCart = async () => {
    if (!nft || nft.isSoldOut || nft.availableSupply <= 0) return
    await addToCart(nft, quantity)
    setIsAddedFeedback(true)
    setIsCartDrawerOpen(true)
    setTimeout(() => setIsAddedFeedback(false), 2500)
  }

  if (isLoading) {
    return (
      <div className="nft-detail-page w-full animate-pulse pb-32 lg:pb-0" aria-busy="true" aria-label="Carregando detalhes da NFT">
        <div className="mx-auto w-full max-w-[1264px] lg:px-8">
          <div className="hidden px-0 pt-4 lg:block"><Skeleton className="h-5 w-32 rounded" /></div>
          <div className="grid grid-cols-1 items-start lg:grid-cols-[100px_448px_minmax(0,1fr)] lg:gap-x-6">
            <section className="px-7 pt-6 lg:col-span-2 lg:px-0 lg:pt-4">
              <div className="mb-1 flex h-9 items-center lg:hidden"><Skeleton className="h-9 w-9 rounded-full" /></div>
              <div className="lg:grid lg:grid-cols-[100px_448px] lg:items-start lg:gap-6">
                <div className="hidden flex-col gap-4 lg:flex">
                  {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-[100px] w-[100px] rounded-lg" />)}
                </div>
                <Skeleton className="mx-auto aspect-square w-full max-w-[min(100%,40svh)] rounded-[24px] lg:mx-0 lg:max-w-none lg:rounded-lg" />
              </div>
            </section>
            <section className="relative z-10 -mt-8 space-y-4 rounded-t-[36px] bg-surface px-6 pb-6 pt-8 lg:col-start-3 lg:row-start-1 lg:mt-0 lg:space-y-4 lg:rounded-none lg:bg-transparent lg:px-0 lg:pb-0 lg:pt-4">
              <Skeleton className="h-8 w-3/4 lg:mt-2 lg:h-9" />
              <Skeleton className="h-7 w-32" />
              <div className="flex gap-2"><Skeleton className="h-8 w-8 rounded-full" /><Skeleton className="h-8 w-8 rounded-full" /><Skeleton className="h-8 w-8 rounded-full" /><Skeleton className="h-8 w-8 rounded-full" /></div>
              <div className="space-y-2 border-t border-border pt-3 lg:pt-4"><Skeleton className="h-5 w-36" /><Skeleton className="h-16 w-full rounded-lg" /></div>
              <div className="space-y-2"><Skeleton className="h-5 w-20" /><Skeleton className="h-7 w-40 rounded-full" /></div>
              <div className="space-y-2"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-5/6" /></div>
              <div className="hidden gap-3 lg:flex"><Skeleton className="h-10 flex-1 rounded-full" /><Skeleton className="h-10 w-32 rounded-full" /></div>
            </section>
          </div>
          <section className="mt-8 px-6 lg:mt-16 lg:px-0">
            <div className="flex gap-2 border-b border-border"><Skeleton className="h-12 w-24" /><Skeleton className="h-12 w-24" /><Skeleton className="h-12 w-24" /><Skeleton className="h-12 w-36" /></div>
            <div className="min-h-[200px] space-y-3 py-5"><Skeleton className="h-6 w-48" /><Skeleton className="h-12 w-full rounded-lg" /><Skeleton className="h-12 w-full rounded-lg" /></div>
          </section>
          <section className="mt-8 border-t border-border px-6 pb-12 pt-8 lg:mt-10 lg:px-0 lg:pb-16 lg:pt-10">
            <Skeleton className="mb-5 h-7 w-52" />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 lg:gap-6">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="aspect-square rounded-lg" />)}
            </div>
          </section>
        </div>
      </div>
    )
  }

  // 404 Treatment
  if (isError || !nft) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-red-500/10 text-red-400 mx-auto flex items-center justify-center">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold text-foreground">NFT Não Encontrado (404)</h2>
          <p className="text-foreground-muted text-sm">
            {(error as Error)?.message || 'A obra solicitada não existe ou foi removida do marketplace.'}
          </p>
        </div>
        <Button onClick={() => navigate({ to: '/' })} className="font-bold">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar ao Catálogo Principal
        </Button>
      </div>
    )
  }

  const galleryImages = nft.gallery && nft.gallery.length > 0 ? nft.gallery : [nft.image]
  const currentImage = selectedImage || nft.image

  const recommendedFiltered = (recommendedData?.items || []).filter((item) => item.id !== nft.id)
  const siblingEdition = recommendedFiltered.find((item) => item.collection === nft.collection)

  return (
    <div className="nft-detail-page w-full pb-32 lg:pb-0">
      <div className="mx-auto w-full max-w-[1264px] lg:px-8">
        <div className="hidden px-0 pt-4 lg:block">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-foreground hover:text-primary">
            Início <span className="text-foreground-muted">/</span> Mercado
          </Link>
        </div>

        <div className="grid grid-cols-1 items-start lg:grid-cols-[100px_448px_minmax(0,1fr)] lg:gap-x-6">
          <section className="px-7 pt-6 lg:col-span-2 lg:px-0 lg:pt-4">
            <div className="mb-1 flex h-9 items-center justify-between lg:hidden">
              <Link
                to="/"
                aria-label="Voltar ao catálogo"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-foreground-muted"
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </div>

            <div className="lg:grid lg:grid-cols-[100px_448px] lg:items-start lg:gap-6">
              {galleryImages.length > 1 && (
                <div className="hidden flex-col gap-4 lg:flex">
                  {galleryImages.map((imgUrl, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImage(imgUrl)}
                      className={`h-[100px] w-[100px] overflow-hidden rounded-lg border transition-colors ${
                        currentImage === imgUrl ? 'border-primary' : 'border-transparent hover:border-border-light'
                      }`}
                      aria-label={`Visualizar miniatura ${i + 1}`}
                    >
                      <img src={imgUrl} srcSet={getNFTImageSrcSet(imgUrl)} sizes="100px" alt={`${nft.name} miniatura ${i + 1}`} className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              <div className="relative mx-auto aspect-square w-full max-w-[min(100%,40svh)] overflow-hidden rounded-[24px] bg-surface lg:mx-0 lg:max-w-none lg:rounded-lg lg:p-5">
                <img src={currentImage} srcSet={getNFTImageSrcSet(currentImage)} sizes="(min-width: 1024px) 448px, 86vw" alt={nft.name} fetchPriority="high" className="h-full w-full rounded-[20px] object-cover lg:rounded-xl" />
                {nft.isSoldOut && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                    <Badge variant="danger" className="px-4 py-2 text-sm font-bold uppercase tracking-wider">Esgotado</Badge>
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="relative z-10 -mt-8 rounded-t-[44px] bg-surface px-6 pb-6 pt-8 lg:col-start-3 lg:row-start-1 lg:mt-0 lg:rounded-none lg:bg-transparent lg:px-0 lg:pb-0 lg:pt-4">
            <div className="mb-2 flex items-center justify-between gap-3 lg:hidden">
              <h1 className="min-w-0 flex-1 text-lg font-bold leading-tight text-foreground">{nft.name}</h1>
              {nft.rating !== undefined && nft.reviewCount !== undefined && (
                <button
                  type="button"
                  onClick={() => setActiveTab('reviews')}
                  aria-label={`Nota ${nft.rating.toFixed(1)} de 5, ${nft.reviewCount} avaliações de colecionadores. Abrir avaliações`}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-primary/70 px-2.5 py-1.5 text-xs text-foreground"
                >
                  <Star className="h-3.5 w-3.5 fill-primary text-primary" aria-hidden="true" />
                  <span>{nft.rating.toFixed(1)}</span>
                  <span className="text-foreground-muted">({nft.reviewCount})</span>
                </button>
              )}
            </div>


            <h1 className="hidden text-[28px] font-bold leading-tight text-foreground lg:mt-2 lg:block">{nft.name}</h1>
            <div className="mb-3 mt-2 hidden items-center justify-between gap-3 lg:mb-4 lg:flex">
              <span data-testid="nft-price" className="font-mono text-xl font-bold text-primary lg:text-2xl">{formatEth(nft.price)}</span>
              {nft.rating !== undefined && nft.reviewCount !== undefined && (
                <button
                  type="button"
                  onClick={() => setActiveTab('reviews')}
                  aria-label={`Abrir ${nft.reviewCount} avaliações de colecionadores`}
                  className="inline-flex items-center gap-1.5 text-xs text-foreground-muted transition-colors hover:text-primary"
                >
                  <span className="inline-flex items-center gap-0.5 text-primary" aria-hidden="true">
                    {Array.from({ length: 5 }, (_, index) => <Star key={index} className="h-3.5 w-3.5 fill-current" />)}
                  </span>
                  <span>({nft.reviewCount})</span>
                </button>
              )}
            </div>

            <div className="mb-4 flex items-center gap-2" aria-label="Compartilhar NFT">
              <span className="mr-1 text-xs text-foreground-muted">Compartilhar</span>
              <button type="button" onClick={() => handleShare('x')} aria-label="Compartilhar no X" className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-foreground hover:border-primary hover:text-primary"><svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true"><path d="M18.9 2H22l-6.8 7.8L23.2 22h-6.3L12 14.6 5.5 22H2.3l7.3-8.4L1.8 2h6.5l4.5 6.8L18.9 2Zm-1.1 18h1.7L7.3 3.9H5.5L17.8 20Z" /></svg></button>
              <button type="button" onClick={() => handleShare('facebook')} aria-label="Compartilhar no Facebook" className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-foreground hover:border-primary hover:text-primary"><svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true"><path d="M13.5 21v-8.2h2.8l.4-3.2h-3.2v-2c0-.9.3-1.6 1.6-1.6h1.7V3.1c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.3H7.3v3.2h2.8V21h3.4Z" /></svg></button>
              <button type="button" onClick={() => handleShare('whatsapp')} aria-label="Compartilhar no WhatsApp" className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-foreground hover:border-primary hover:text-primary"><svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true"><path d="M12 2a9.8 9.8 0 0 0-8.4 14.8L2.3 22l5.4-1.4A9.9 9.9 0 1 0 12 2Zm0 17.9a8 8 0 0 1-4.1-1.1l-.3-.2-3.2.8.9-3.1-.2-.3A8 8 0 1 1 12 19.9Zm4.4-6c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.5.1-.2.2-.6.8-.8.9-.1.2-.3.2-.5.1-.2-.1-1-.4-1.9-1.2-.7-.6-1.2-1.4-1.3-1.6-.1-.2 0-.3.1-.5l.4-.4.2-.4c.1-.2 0-.3 0-.4l-.7-1.7c-.2-.5-.4-.4-.5-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 1.9s.8 2.2.9 2.4c.1.2 1.6 2.5 3.9 3.4.5.2.9.3 1.2.4.5.2 1 .1 1.4.1.4-.1 1.4-.6 1.6-1.1.2-.5.2-1 .1-1.1-.1-.1-.2-.2-.4-.3Z" /></svg></button>
              <button type="button" onClick={handleCopyShareLink} aria-label="Copiar link do NFT" className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-foreground hover:border-primary hover:text-primary"><Copy className="h-4 w-4" /></button>
              {shareLinkCopied && <span role="status" className="text-xs text-primary">Link copiado</span>}
            </div>

            <div className="border-t border-border pt-3 lg:pt-4">
              <h2 className="mb-2 text-sm font-bold text-foreground">Sobre este NFT:</h2>
              <p className="line-clamp-3 text-xs leading-relaxed text-foreground-muted lg:line-clamp-none lg:text-sm">{nft.description}</p>
            </div>

            <div className="mt-3 lg:mt-4">
              <h2 className="mb-2 text-sm font-bold text-foreground">Edição:</h2>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex rounded-full border border-primary/60 px-3 py-1 text-xs text-foreground-muted">
                  {nft.edition} / {nft.totalEditions.toLocaleString('pt-BR')}
                </span>
                {siblingEdition && (
                  <Link to="/nft/$nftId" params={{ nftId: siblingEdition.id }} aria-label={`Ver edição ${siblingEdition.edition}`} className="inline-flex rounded-full border border-border px-3 py-1 text-xs text-foreground-muted transition-colors hover:border-primary hover:text-primary">
                    {siblingEdition.edition} / {siblingEdition.totalEditions.toLocaleString('pt-BR')}
                  </Link>
                )}
              </div>
            </div>

            <div className="mt-3 space-y-2 text-xs text-foreground-muted lg:mt-4 lg:space-y-2.5">
              <p><span className="font-bold text-foreground">ID do token:</span> {nft.edition.replace(/^#/, '')}</p>
              <p><span className="font-bold text-foreground">Coleção:</span> {nft.collection}</p>
              <p className="line-clamp-2 lg:line-clamp-none">
                <span className="font-bold text-foreground">Atributos:</span>{' '}
                {nft.traits.map((trait) => trait.value).join(', ')}
              </p>
            </div>

            <div className="mt-5 hidden items-center gap-3 lg:flex">
              {!nft.isSoldOut && nft.availableSupply > 0 && (
                <div className="flex h-10 items-center rounded-full border border-border bg-surface px-1">
                  <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} disabled={quantity <= 1} className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-background disabled:opacity-40" aria-label="Diminuir quantidade"><Minus className="h-4 w-4" /></button>
                  <span className="w-9 text-center font-mono text-sm">{quantity}</span>
                  <button onClick={() => setQuantity((q) => Math.min(nft.availableSupply, q + 1))} disabled={quantity >= nft.availableSupply} className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-background disabled:opacity-40" aria-label="Aumentar quantidade"><Plus className="h-4 w-4" /></button>
                </div>
              )}
              <Button onClick={handleAddToCart} disabled={nft.isSoldOut || nft.availableSupply <= 0} className="h-10 flex-1 font-bold uppercase">
                {isAddedFeedback ? 'Adicionado ao carrinho' : `Comprar${quantity > 1 ? ` (${quantity})` : ''}`}
              </Button>
              <Button type="button" variant="outline" onClick={handleToggleFavorite} className="h-10 gap-2 border-primary/70 text-primary" aria-label={nft.isLiked ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}>
                <Heart className={`h-4 w-4 ${nft.isLiked ? 'fill-current' : ''}`} /> Favoritar
              </Button>
            </div>
          </section>
        </div>

        <section className="mt-8 px-6 lg:mt-16 lg:px-0">
          <div className="flex overflow-x-auto border-b border-border">
            <button onClick={() => setActiveTab('details')} className={`shrink-0 border-b-2 px-4 py-3 text-sm font-bold ${activeTab === 'details' ? 'border-primary text-primary' : 'border-transparent text-foreground-muted'}`}>Descrição &amp; Detalhes</button>
            <button onClick={() => setActiveTab('traits')} className={`shrink-0 border-b-2 px-4 py-3 text-sm font-bold ${activeTab === 'traits' ? 'border-primary text-primary' : 'border-transparent text-foreground-muted'}`}>Propriedades ({nft.traits.length})</button>
            <button onClick={() => setActiveTab('history')} className={`shrink-0 border-b-2 px-4 py-3 text-sm font-bold ${activeTab === 'history' ? 'border-primary text-primary' : 'border-transparent text-foreground-muted'}`}>Histórico ({nft.history.length})</button>
            <button onClick={() => setActiveTab('reviews')} className={`shrink-0 border-b-2 px-4 py-3 text-sm font-bold ${activeTab === 'reviews' ? 'border-primary text-primary' : 'border-transparent text-foreground-muted'}`}>Avaliações de colecionadores</button>
          </div>
          <div className="py-5 lg:min-h-[250px]">
            {activeTab === 'traits' && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {nft.traits.map((trait, i) => (
                  <div key={i} className="space-y-1 border border-border bg-surface p-3 text-left">
                    <span className="block text-[10px] uppercase tracking-wider text-foreground-muted">{trait.type}</span>
                    <strong className="block truncate text-sm text-foreground">{trait.value}</strong>
                    <span className="block font-mono text-[10px] text-primary">{trait.rarity}% têm isso</span>
                  </div>
                ))}
              </div>
            )}
            {activeTab === 'details' && (
              <div className="space-y-5 text-xs leading-relaxed text-foreground-muted lg:text-sm">
                <p>{nft.description}</p>
                <p>A propriedade inclui arte em alta resolução e metadados registrados para esta edição.</p>
                <div className="space-y-2 border-t border-border pt-4">
                  <div className="flex justify-between gap-4"><span>Criador</span><span className="text-right text-foreground">{nft.creator.name}</span></div>
                  <div className="flex justify-between gap-4"><span>Padrão do Token</span><span className="text-foreground">ERC-721</span></div>
                  <div className="flex justify-between gap-4"><span>Rede Blockchain</span><span className="text-foreground">Ethereum Mainnet</span></div>
                  <div className="flex justify-between gap-4"><span>Endereço do Contrato</span><span className="font-mono text-foreground">{truncateAddress(nft.creator.address)}</span></div>
                </div>
              </div>
            )}
            {activeTab === 'history' && (
              <div className="space-y-3">
                {nft.history.length === 0 ? <p className="py-4 text-center text-xs text-foreground-muted">Nenhum evento registrado ainda.</p> : nft.history.map((h, i) => (
                  <div key={i} className="flex items-center justify-between gap-4 border-b border-border py-3 text-xs">
                    <div className="space-y-1">
                      <span className="block text-[10px] font-bold uppercase text-foreground">{h.event}</span>
                      <span className="block font-mono text-foreground-muted">De {truncateAddress(h.from)} para {truncateAddress(h.to)}</span>
                      <span className="block text-[10px] text-foreground-muted">{formatDate(h.date)}</span>
                    </div>
                    {h.price && <span className="font-mono font-bold text-primary">{formatEth(h.price)}</span>}
                  </div>
                ))}
              </div>
            )}
            {activeTab === 'reviews' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-foreground">Avaliações de colecionadores</h2>
                  {nft.reviewCount !== undefined && <span className="text-xs text-foreground-muted">({nft.reviewCount})</span>}
                </div>
                {nft.reviews?.length ? nft.reviews.map((review, index) => (
                  <article key={`${review.author}-${index}`} className="rounded-2xl border border-border bg-surface-secondary/40 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">{review.author}</h3>
                        {review.isMock && <span className="mt-1 inline-block rounded-full border border-primary/50 px-2 py-0.5 text-[10px] text-primary">Comentário de demonstração</span>}
                      </div>
                      <div className="flex items-center gap-1" aria-label={`Nota ${review.rating} de 5`}>
                        {Array.from({ length: 5 }, (_, starIndex) => (
                          <Star key={starIndex} className={`h-3.5 w-3.5 ${starIndex < review.rating ? 'fill-primary text-primary' : 'text-border'}`} aria-hidden="true" />
                        ))}
                      </div>
                    </div>
                    <p className="mt-3 text-xs leading-relaxed text-foreground-muted">{review.comment}</p>
                  </article>
                )) : (
                  <div className="flex min-h-[140px] flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-surface-secondary/30 text-center">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface text-primary" aria-hidden="true"><Star className="h-5 w-5" /></div>
                    <p className="text-xs text-foreground-muted">Ainda não há avaliações registradas para esta obra.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {recommendedFiltered.length > 0 && (
          <section className="mt-8 border-t border-border px-6 pb-12 pt-8 lg:mt-10 lg:px-0 lg:pb-16 lg:pt-10">
            <div className="mb-5 flex items-center justify-between gap-4">
              <h2 className="text-base font-bold text-primary lg:text-lg">Mais desta coleção</h2>
              <Link to="/" search={{ category: nft.category }} className="hidden text-xs font-bold text-primary hover:text-foreground sm:block">Ver coleção completa</Link>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 lg:gap-6">
              {recommendedFiltered.slice(0, 5).map((item) => <NFTCard key={item.id} nft={item} />)}
            </div>
          </section>
        )}
      </div>

      {!nft.isSoldOut && nft.availableSupply > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 rounded-t-[32px] border-t border-border bg-surface px-6 pb-[34px] pt-[18px] shadow-[0_-12px_36px_rgba(0,0,0,0.25)] lg:hidden">
          <div className="mb-[22px] flex items-center justify-between text-sm leading-7">
            <div className="flex items-center gap-2">
              <span className="text-xs text-foreground-muted">Qtd.</span>
              <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} disabled={quantity <= 1} className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-background disabled:opacity-40" aria-label="Diminuir quantidade"><Minus className="h-3.5 w-3.5" /></button>
              <span className="w-4 text-center font-mono">{quantity}</span>
              <button onClick={() => setQuantity((q) => Math.min(nft.availableSupply, q + 1))} disabled={quantity >= nft.availableSupply} className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-background disabled:opacity-40" aria-label="Aumentar quantidade"><Plus className="h-3.5 w-3.5" /></button>
            </div>
            <span data-testid="nft-price" className="font-mono text-lg font-bold text-primary">{formatEth(nft.price)}</span>
          </div>
          <div className="flex gap-3">
            <Button onClick={handleAddToCart} className="h-[58px] flex-1 rounded-full text-sm font-bold" aria-label={isAddedFeedback ? 'NFT adicionado ao carrinho' : 'Comprar NFT'}>
              {isAddedFeedback ? 'Adicionado ao carrinho' : 'Comprar NFT'}
            </Button>
            <Button type="button" variant="outline" onClick={handleToggleFavorite} className="h-[58px] w-[58px] rounded-full border-primary/50 px-0 text-primary" aria-label={nft.isLiked ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}>
              <Heart className={`h-5 w-5 ${nft.isLiked ? 'fill-current' : ''}`} />
            </Button>
            <Button variant="outline" onClick={handleAddToCart} className="h-[58px] w-[58px] rounded-full border-primary/30 px-0 text-primary" aria-label="Adicionar NFT ao carrinho">
              <ShoppingCart className="h-5 w-5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
