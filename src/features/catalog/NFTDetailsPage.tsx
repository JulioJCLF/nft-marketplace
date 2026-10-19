import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { NFT, CatalogResponse } from '@/types'
import { formatEth, formatUsdEquivalent, truncateAddress, formatDate } from '@/lib/eth'
import { useCart } from '@/features/cart/CartContext'
import { useAuth } from '@/features/auth/AuthContext'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { NFTCard } from './NFTCard'
import {
  Heart,
  ShoppingBag,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Plus,
  Minus,
} from 'lucide-react'
import { Link, useNavigate } from '@tanstack/react-router'

interface NFTDetailsPageProps {
  nftId: string
}

export const NFTDetailsPage: React.FC<NFTDetailsPageProps> = ({ nftId }) => {
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const { isAuthenticated, setAuthModalOpen } = useAuth()
  const queryClient = useQueryClient()

  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [quantity, setQuantity] = useState<number>(1)
  const [activeTab, setActiveTab] = useState<'traits' | 'history' | 'details'>('traits')
  const [isAddedFeedback, setIsAddedFeedback] = useState(false)

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
  })

  // Fetch Recommended NFTs from same collection
  const { data: recommendedData } = useQuery<CatalogResponse>({
    queryKey: ['nfts', { limit: 4 }],
    queryFn: async () => {
      const response = await api.get<CatalogResponse>('/nfts?limit=4')
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

  const handleAddToCart = async () => {
    if (!nft || nft.isSoldOut || nft.availableSupply <= 0) return
    await addToCart(nft, quantity)
    setIsAddedFeedback(true)
    setTimeout(() => setIsAddedFeedback(false), 2500)
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-pulse">
        <Skeleton className="w-32 h-8 rounded" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-6 space-y-4">
            <Skeleton className="w-full aspect-square rounded-2xl" />
            <div className="flex gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="w-20 h-20 rounded-lg" />
              ))}
            </div>
          </div>
          <div className="lg:col-span-6 space-y-6">
            <Skeleton className="w-48 h-6 rounded" />
            <Skeleton className="w-3/4 h-10 rounded" />
            <Skeleton className="w-full h-24 rounded-lg" />
            <Skeleton className="w-full h-14 rounded-lg" />
          </div>
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-16">
      {/* Back button */}
      <div>
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-foreground-muted hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Voltar ao Catálogo</span>
        </Link>
      </div>

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left Column: Image Gallery */}
        <div className="lg:col-span-6 space-y-4">
          <div className="relative aspect-square rounded-2xl overflow-hidden border border-border bg-surface-secondary shadow-xl">
            <img
              src={currentImage}
              alt={nft.name}
              className="w-full h-full object-cover transition-all duration-300"
            />
            {nft.isSoldOut && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                <span className="px-6 py-2 rounded-full bg-red-600 text-white font-black tracking-widest text-lg uppercase shadow-2xl">
                  Esgotado
                </span>
              </div>
            )}
            <button
              onClick={handleToggleFavorite}
              className={`absolute top-4 right-4 p-3 rounded-full backdrop-blur-md transition-all ${
                nft.isLiked
                  ? 'bg-red-500/20 text-red-500 border border-red-500/40'
                  : 'bg-black/40 text-foreground-muted hover:text-white border border-white/10'
              }`}
              aria-label={nft.isLiked ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
            >
              <Heart className={`w-5 h-5 ${nft.isLiked ? 'fill-red-500' : ''}`} />
            </button>
          </div>

          {/* Thumbnails Gallery */}
          {galleryImages.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {galleryImages.map((imgUrl, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(imgUrl)}
                  className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 bg-surface-tertiary ${
                    currentImage === imgUrl ? 'border-primary ring-2 ring-primary/30' : 'border-border opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={imgUrl} alt={`${nft.name} miniatura ${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Metadata & Purchase Box */}
        <div className="lg:col-span-6 space-y-6">
          {/* Collection & Verification */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-primary tracking-wider uppercase">{nft.collection}</span>
              <CheckCircle2 className="w-4 h-4 text-primary fill-primary/20" />
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs font-mono">
                {nft.edition} de {nft.totalEditions}
              </Badge>
              <span className="text-xs text-foreground-muted flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 text-red-400 fill-red-400" />
                {nft.likes} favoritos
              </span>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">{nft.name}</h1>

          {/* Creator Information */}
          <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-surface-secondary/40">
            <img
              src={nft.creator.avatar}
              alt={nft.creator.name}
              className="w-10 h-10 rounded-full bg-surface-tertiary border border-border"
            />
            <div className="flex-1 min-w-0">
              <span className="text-[10px] text-foreground-muted uppercase block">Criado por</span>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-foreground truncate">{nft.creator.name}</span>
                <span className="text-[10px] text-foreground-muted font-mono">({truncateAddress(nft.creator.address)})</span>
              </div>
            </div>
          </div>

          {/* Price & Stock Box */}
          <div className="p-6 rounded-2xl border border-border bg-surface shadow-lg space-y-4">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-xs text-foreground-muted uppercase block font-semibold mb-1">Preço Atual</span>
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-black font-mono text-primary">{formatEth(nft.price)}</span>
                  {nft.originalPrice && (
                    <span className="text-sm font-mono text-foreground-muted line-through">
                      {formatEth(nft.originalPrice)}
                    </span>
                  )}
                </div>
                <span className="text-xs text-foreground-muted block mt-1">
                  ≈ {formatUsdEquivalent(nft.price)} USD
                </span>
              </div>

              {/* Stock status */}
              <div className="text-right">
                <span className="text-xs text-foreground-muted block font-semibold mb-1">Disponibilidade</span>
                {nft.isSoldOut || nft.availableSupply <= 0 ? (
                  <Badge variant="danger" className="font-bold uppercase tracking-wider">
                    Esgotado
                  </Badge>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>{nft.availableSupply} em estoque</span>
                  </div>
                )}
              </div>
            </div>

            {/* Quantity Selector & Action Button */}
            {!nft.isSoldOut && nft.availableSupply > 0 && (
              <div className="space-y-3 pt-4 border-t border-border/60">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground-muted">Quantidade desejada:</span>
                  <div className="flex items-center border border-border rounded-lg bg-surface-secondary">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                      className="px-3 py-1.5 text-foreground-muted hover:text-foreground disabled:opacity-30"
                      aria-label="Diminuir quantidade"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-3 text-xs font-bold text-foreground font-mono min-w-[24px] text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity((q) => Math.min(nft.availableSupply, q + 1))}
                      disabled={quantity >= nft.availableSupply}
                      className="px-3 py-1.5 text-foreground-muted hover:text-foreground disabled:opacity-30"
                      aria-label="Aumentar quantidade"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <Button
                  onClick={handleAddToCart}
                  size="lg"
                  className="w-full gap-2 font-bold text-base shadow-xl"
                >
                  {isAddedFeedback ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-white" />
                      <span>Item Adicionado ao Carrinho!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-5 h-5" />
                      <span>Adicionar ao Carrinho ({quantity})</span>
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Tabs: Description, Traits, History */}
          <div className="pt-2">
            <div className="flex border-b border-border">
              <button
                onClick={() => setActiveTab('traits')}
                className={`py-3 px-4 text-xs font-bold border-b-2 transition-all ${
                  activeTab === 'traits'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-foreground-muted hover:text-foreground'
                }`}
              >
                Propriedades ({nft.traits.length})
              </button>
              <button
                onClick={() => setActiveTab('details')}
                className={`py-3 px-4 text-xs font-bold border-b-2 transition-all ${
                  activeTab === 'details'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-foreground-muted hover:text-foreground'
                }`}
              >
                Descrição & Detalhes
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`py-3 px-4 text-xs font-bold border-b-2 transition-all ${
                  activeTab === 'history'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-foreground-muted hover:text-foreground'
                }`}
              >
                Histórico ({nft.history.length})
              </button>
            </div>

            <div className="py-4">
              {activeTab === 'traits' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {nft.traits.map((trait, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl border border-border bg-surface-secondary/50 text-center space-y-1"
                    >
                      <span className="text-[10px] text-foreground-muted uppercase tracking-wider font-semibold block">
                        {trait.type}
                      </span>
                      <strong className="text-xs text-foreground block truncate">{trait.value}</strong>
                      <span className="text-[10px] text-primary font-mono block">{trait.rarity}% têm isso</span>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'details' && (
                <div className="space-y-4 text-xs text-foreground-muted leading-relaxed">
                  <p>{nft.description}</p>
                  <div className="pt-3 border-t border-border/40 space-y-2">
                    <div className="flex justify-between">
                      <span>Endereço do Contrato</span>
                      <span className="font-mono text-foreground font-semibold">0xbc4c...f13d</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Padrão do Token</span>
                      <span className="text-foreground font-semibold">ERC-721</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Rede Blockchain</span>
                      <span className="text-foreground font-semibold">Ethereum Mainnet</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'history' && (
                <div className="space-y-3">
                  {nft.history.length === 0 ? (
                    <p className="text-xs text-foreground-muted py-4 text-center">Nenhum evento registrado ainda.</p>
                  ) : (
                    nft.history.map((h, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-3 rounded-lg border border-border bg-surface-secondary/30 text-xs"
                      >
                        <div className="space-y-0.5">
                          <span className="font-bold text-foreground uppercase text-[10px] tracking-wider block">
                            {h.event}
                          </span>
                          <span className="text-[11px] text-foreground-muted font-mono">
                            De {truncateAddress(h.from)} para {truncateAddress(h.to)}
                          </span>
                          <span className="text-[10px] text-foreground-muted block">{formatDate(h.date)}</span>
                        </div>
                        {h.price && (
                          <div className="text-right">
                            <span className="font-mono font-bold text-primary block">{formatEth(h.price)}</span>
                            <span className="text-[10px] text-foreground-muted font-mono">{h.txHash}</span>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recommended Section: Outros da mesma coleção */}
      {recommendedFiltered.length > 0 && (
        <section className="pt-12 border-t border-border space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-foreground">Outros da mesma coleção</h2>
              <p className="text-xs text-foreground-muted mt-0.5">Explore mais primatas raros do ecossistema</p>
            </div>
            <Link to="/" search={{ category: nft.category }}>
              <Button variant="outline" size="sm">
                Ver Coleção Completa
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {recommendedFiltered.map((item) => (
              <NFTCard key={item.id} nft={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
