import React from 'react'
import { Link } from '@tanstack/react-router'
import { Heart } from 'lucide-react'
import { NFT, CatalogResponse } from '@/types'
import { formatEth, formatUsdEquivalent } from '@/lib/eth'
import { useAuth } from '@/features/auth/AuthContext'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { getNFTImageSrcSet } from '@/lib/nftImage'

interface NFTCardProps {
  nft: NFT
  priority?: boolean
}

export const NFTCard: React.FC<NFTCardProps> = ({ nft, priority = false }) => {
  const { isAuthenticated, setAuthModalOpen } = useAuth()
  const queryClient = useQueryClient()

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

  return (
    <article className="group relative rounded-lg bg-surface transition-colors duration-200 flex flex-col px-2 pb-2.5 pt-1.5">
      {/* Image Container with zoom & separated favorite button */}
        <div className="relative aspect-square overflow-hidden rounded-md bg-surface-secondary">
        <Link
          to="/nft/$nftId"
          params={{ nftId: nft.id }}
          className="block w-full h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md"
          aria-label={`Ver detalhes de ${nft.name}`}
        >
          <img
            src={nft.image}
            alt={nft.name}
            srcSet={getNFTImageSrcSet(nft.image)}
            sizes="(min-width: 1024px) 260px, (min-width: 640px) 32vw, 40vw"
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : 'auto'}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </Link>

        {/* Favorite Heart Button - completely decoupled from link */}
        <button
          type="button"
          onClick={handleToggleFavorite}
          className={`absolute top-2 right-2 sm:top-2.5 sm:right-2.5 z-10 p-1.5 sm:p-2 rounded-full backdrop-blur-md transition-all opacity-0 group-hover:opacity-100 focus-visible:opacity-100 ${
            nft.isLiked
              ? 'bg-red-500/20 text-red-500 border border-red-500/40'
              : 'bg-black/40 text-foreground-muted hover:text-white border border-white/10'
          }`}
          aria-label={nft.isLiked ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
        >
          <Heart className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${nft.isLiked ? 'fill-red-500' : ''}`} />
        </button>

        {/* Edition / Sold Out Badge */}
        <div className="sr-only">
          {nft.isSoldOut || nft.availableSupply <= 0 ? (
            <span>Esgotado</span>
          ) : (
            <span>{nft.edition}</span>
          )}
        </div>
      </div>

      {/* Card Content */}
      <div className="pt-2 flex-1 flex flex-col justify-between space-y-2">
        {/* Creator Info */}
        <div className="sr-only">
          <div className="flex items-center gap-1.5 text-foreground-muted truncate">
            <img
              src={nft.creator.avatar}
              alt={nft.creator.name}
              className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-surface-tertiary"
            />
            <span className="truncate">{nft.creator.name}</span>
          </div>
          <span className="text-[10px] sm:text-[11px] text-foreground-muted flex items-center gap-1">
            <Heart className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-red-400" />
            {nft.likes}
          </span>
        </div>

        {/* NFT Title & Collection */}
        <div>
          <Link
            to="/nft/$nftId"
            params={{ nftId: nft.id }}
            className="font-bold text-xs sm:text-sm text-foreground hover:text-primary transition-colors block truncate"
          >
            {nft.name}
          </Link>
          <p className="sr-only">{nft.collection}</p>
        </div>

        {/* Bottom Price (Editorial Layout matching Figma Frame 2:2 & 14:5226) */}
        <div className="pt-2 border-t border-border/40 flex items-center justify-between gap-1">
          <div className="min-w-0">
            <span className="sr-only">Preço</span>
            <span className="font-mono font-bold text-sm text-primary block leading-none truncate">
              {formatEth(nft.price)}
            </span>
          </div>
          <span className="sr-only">
            {formatUsdEquivalent(nft.price)}
          </span>
        </div>
      </div>
    </article>
  )
}
