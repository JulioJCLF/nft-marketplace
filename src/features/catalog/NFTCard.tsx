import React, { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Heart, ShoppingBag, Check } from 'lucide-react'
import { NFT, CatalogResponse } from '@/types'
import { formatEth, formatUsdEquivalent } from '@/lib/eth'
import { useCart } from '@/features/cart/CartContext'
import { useAuth } from '@/features/auth/AuthContext'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Badge } from '@/components/ui/Badge'

interface NFTCardProps {
  nft: NFT
}

export const NFTCard: React.FC<NFTCardProps> = ({ nft }) => {
  const { addToCart, items } = useCart()
  const { isAuthenticated, setAuthModalOpen } = useAuth()
  const queryClient = useQueryClient()
  const [justAdded, setJustAdded] = useState(false)

  const isAlreadyInCart = items.some((item) => item.nftId === nft.id)

  // Real Optimistic Mutation with Rollback for Favorites
  const favoriteMutation = useMutation({
    mutationFn: async ({ nftId, isCurrentlyLiked }: { nftId: string; isCurrentlyLiked: boolean }) => {
      if (isCurrentlyLiked) {
        await api.delete(`/favorites/${nftId}`)
      } else {
        await api.post(`/favorites/${nftId}`)
      }
    },
    onMutate: async ({ nftId, isCurrentlyLiked }) => {
      // 1. Cancel ongoing refetches
      await queryClient.cancelQueries({ queryKey: ['nfts'] })
      await queryClient.cancelQueries({ queryKey: ['nft', nftId] })

      // 2. Snapshot previous values
      const previousCatalogs = queryClient.getQueriesData<CatalogResponse>({ queryKey: ['nfts'] })
      const previousNFT = queryClient.getQueryData<NFT>(['nft', nftId])

      // 3. Optimistically update Catalog List
      queryClient.setQueriesData<CatalogResponse>(
        { queryKey: ['nfts'] },
        (old) => {
          if (!old) return old
          return {
            ...old,
            items: old.items.map((item) => {
              if (item.id === nftId) {
                return {
                  ...item,
                  isLiked: !isCurrentlyLiked,
                  likes: isCurrentlyLiked ? Math.max(0, item.likes - 1) : item.likes + 1,
                }
              }
              return item
            }),
          }
        }
      )

      // 4. Optimistically update Detail cache if present
      if (previousNFT) {
        queryClient.setQueryData<NFT>(['nft', nftId], {
          ...previousNFT,
          isLiked: !isCurrentlyLiked,
          likes: isCurrentlyLiked ? Math.max(0, previousNFT.likes - 1) : previousNFT.likes + 1,
        })
      }

      return { previousCatalogs, previousNFT }
    },
    onError: (_err, { nftId }, context) => {
      // Rollback to saved snapshots on error!
      if (context?.previousCatalogs) {
        for (const [queryKey, prevData] of context.previousCatalogs) {
          queryClient.setQueryData(queryKey, prevData)
        }
      }
      if (context?.previousNFT) {
        queryClient.setQueryData(['nft', nftId], context.previousNFT)
      }
      console.warn('[Optimistic Update] Rollback executado devido a falha na requisição.')
    },
    onSettled: (_data, _error, { nftId }) => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] })
      queryClient.invalidateQueries({ queryKey: ['nft', nftId] })
    },
  })

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isAuthenticated) {
      setAuthModalOpen(true)
      return
    }
    favoriteMutation.mutate({
      nftId: nft.id,
      isCurrentlyLiked: !!nft.isLiked,
    })
  }

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (nft.isSoldOut || nft.availableSupply <= 0) return

    await addToCart(nft, 1)
    setJustAdded(true)
    setTimeout(() => setJustAdded(false), 2000)
  }

  return (
    <article className="group relative rounded-2xl border border-border bg-surface hover:border-primary/60 transition-all duration-300 flex flex-col p-3.5 shadow-sm hover:shadow-xl hover:-translate-y-1">
      {/* Image Container with zoom */}
      <Link to="/nft/$nftId" params={{ nftId: nft.id }} className="block relative aspect-square overflow-hidden rounded-xl bg-surface-secondary">
        <img
          src={nft.image}
          alt={nft.name}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Favorite Heart Button */}
        <button
          onClick={handleToggleFavorite}
          className={`absolute top-2.5 right-2.5 p-2 rounded-full backdrop-blur-md transition-all ${
            nft.isLiked
              ? 'bg-red-500/20 text-red-500 border border-red-500/40'
              : 'bg-black/40 text-foreground-muted hover:text-white border border-white/10'
          }`}
          aria-label={nft.isLiked ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
        >
          <Heart className={`w-3.5 h-3.5 ${nft.isLiked ? 'fill-red-500' : ''}`} />
        </button>

        {/* Edition / Sold Out Badge */}
        <div className="absolute bottom-2.5 left-2.5 flex gap-1.5">
          {nft.isSoldOut || nft.availableSupply <= 0 ? (
            <Badge variant="danger" className="font-bold uppercase tracking-wider text-[10px]">
              Esgotado
            </Badge>
          ) : (
            <Badge variant="secondary" className="backdrop-blur-md bg-black/60 text-foreground text-[10px]">
              {nft.edition}
            </Badge>
          )}
        </div>
      </Link>

      {/* Card Content */}
      <div className="pt-3 flex-1 flex flex-col justify-between space-y-2.5">
        {/* Creator Info */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-foreground-muted truncate">
            <img
              src={nft.creator.avatar}
              alt={nft.creator.name}
              className="w-4 h-4 rounded-full bg-surface-tertiary"
            />
            <span className="truncate">{nft.creator.name}</span>
          </div>
          <span className="text-[11px] text-foreground-muted flex items-center gap-1">
            <Heart className="w-3 h-3 text-red-400" />
            {nft.likes}
          </span>
        </div>

        {/* NFT Title & Collection */}
        <div>
          <Link
            to="/nft/$nftId"
            params={{ nftId: nft.id }}
            className="font-bold text-sm text-foreground hover:text-primary transition-colors block truncate"
          >
            {nft.name}
          </Link>
          <p className="text-xs text-foreground-muted truncate">{nft.collection}</p>
        </div>

        {/* Bottom Price and Add CTA */}
        <div className="pt-2 border-t border-border/40 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-foreground-muted uppercase block leading-none mb-1">Preço</span>
            <span className="font-mono font-bold text-sm text-primary block leading-none">
              {formatEth(nft.price)}
            </span>
            <span className="text-[10px] text-foreground-muted block mt-0.5">
              {formatUsdEquivalent(nft.price)}
            </span>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={nft.isSoldOut || nft.availableSupply <= 0}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold text-xs transition-all shadow-sm ${
              nft.isSoldOut || nft.availableSupply <= 0
                ? 'bg-surface-secondary text-foreground-muted/40 cursor-not-allowed border border-border/40'
                : justAdded
                ? 'bg-emerald-600 text-white'
                : isAlreadyInCart
                ? 'bg-primary/20 text-primary border border-primary/40 hover:bg-primary/30'
                : 'bg-primary text-primary-foreground hover:bg-primary-hover active:scale-95'
            }`}
            aria-label={
              nft.isSoldOut
                ? 'Esgotado'
                : justAdded
                ? 'Adicionado'
                : isAlreadyInCart
                ? 'No carrinho (+1)'
                : 'Comprar'
            }
          >
            {justAdded ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Adicionado</span>
              </>
            ) : isAlreadyInCart ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>No carrinho</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Comprar</span>
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  )
}
