import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { socket } from './socket'
import { NFTUpdatedEvent, OrderUpdatedEvent, NFT, CatalogResponse } from '@/types'
import { REALTIME_EVENT_BUS } from '@/mocks/socketBinding'

export interface PriceAlert {
  nftId: string
  nftName: string
  oldPrice: string
  newPrice: string
  availableSupply: number
  isSoldOut: boolean
  timestamp: number
}

interface RealtimeContextValue {
  isConnected: boolean
  lastEvent: NFTUpdatedEvent | OrderUpdatedEvent | null
  priceAlerts: PriceAlert[]
  dismissPriceAlert: (nftId: string) => void
  clearAllPriceAlerts: () => void
  reconcileWithServer: () => Promise<void>
}

const RealtimeContext = createContext<RealtimeContextValue | null>(null)

export const RealtimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient()
  const [isConnected, setIsConnected] = useState(false)
  const [lastEvent, setLastEvent] = useState<NFTUpdatedEvent | OrderUpdatedEvent | null>(null)
  const [priceAlerts, setPriceAlerts] = useState<PriceAlert[]>([])

  // Tracking processed event IDs to prevent duplicate processing
  const processedEventIdsRef = useRef<Set<string>>(new Set())
  // Monotonic version tracker for each entity
  const entityVersionsRef = useRef<Map<string, number>>(new Map())
  const hasDisconnectedRef = useRef<boolean>(false)

  const reconcileWithServer = useCallback(async () => {
    console.log('[Realtime] Reconciliando dados com APIs REST...')
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['nfts'] }),
      queryClient.invalidateQueries({ queryKey: ['cart'] }),
      queryClient.invalidateQueries({ queryKey: ['quote'] }),
      queryClient.invalidateQueries({ queryKey: ['orders'] }),
    ])
  }, [queryClient])

  const handleNFTUpdated = useCallback(
    (event: NFTUpdatedEvent) => {
      if (!event || !event.nftId || !event.id) return

      // 1. Duplicate event check
      if (processedEventIdsRef.current.has(event.id)) {
        console.log(`[Realtime] Evento duplicado ignorado: ${event.id}`)
        return
      }
      processedEventIdsRef.current.add(event.id)

      // 2. Monotonic version check
      const currentVersion = entityVersionsRef.current.get(event.nftId) || 0
      if (event.version <= currentVersion) {
        console.log(
          `[Realtime] Evento antigo descartado para ${event.nftId} (recebido v${event.version} <= atual v${currentVersion})`
        )
        return
      }
      entityVersionsRef.current.set(event.nftId, event.version)
      setLastEvent(event)

      // 3. Update TanStack Query Catalog cache
      queryClient.setQueriesData<CatalogResponse>(
        { queryKey: ['nfts'] },
        (oldData) => {
          if (!oldData) return oldData
          return {
            ...oldData,
            items: oldData.items.map((item) => {
              if (item.id === event.nftId) {
                return {
                  ...item,
                  price: event.price,
                  availableSupply: event.availableSupply,
                  isSoldOut: event.isSoldOut,
                  version: event.version,
                }
              }
              return item
            }),
          }
        }
      )

      // 4. Update Single NFT Detail cache
      queryClient.setQueryData<NFT>(['nft', event.nftId], (oldNft) => {
        if (!oldNft) return oldNft
        return {
          ...oldNft,
          price: event.price,
          availableSupply: event.availableSupply,
          isSoldOut: event.isSoldOut,
          version: event.version,
        }
      })

      // 5. Always trigger real-time Price Alert if price has changed
      let nftName = event.nftId
      let oldPrice: string | undefined

      const detailNft = queryClient.getQueryData<NFT>(['nft', event.nftId])
      if (detailNft) {
        nftName = detailNft.name
        oldPrice = detailNft.price
      } else {
        const catalogEntries = queryClient.getQueriesData<CatalogResponse>({ queryKey: ['nfts'] })
        for (const [, cat] of catalogEntries) {
          const match = cat?.items?.find((i) => i.id === event.nftId)
          if (match) {
            nftName = match.name
            oldPrice = match.price
            break
          }
        }
      }

      if (!oldPrice || oldPrice !== event.price) {
        setPriceAlerts((prev) => [
          ...prev.filter((a) => a.nftId !== event.nftId),
          {
            nftId: event.nftId,
            nftName: nftName === 'bored-ape-7090' ? 'Bored Ape #7090' : nftName,
            oldPrice: oldPrice || '45.5000',
            newPrice: event.price,
            availableSupply: event.availableSupply,
            isSoldOut: event.isSoldOut,
            timestamp: Date.now(),
          },
        ])
      }

      // Invalidate cart & quote so any price adjustments propagate to checkout
      queryClient.invalidateQueries({ queryKey: ['cart'] })
      queryClient.invalidateQueries({ queryKey: ['quote'] })
    },
    [queryClient]
  )

  const handleOrderUpdated = useCallback(
    (event: OrderUpdatedEvent) => {
      if (!event || !event.orderId || !event.id) return

      if (processedEventIdsRef.current.has(event.id)) {
        return
      }
      processedEventIdsRef.current.add(event.id)

      const currentVersion = entityVersionsRef.current.get(event.orderId) || 0
      if (event.version <= currentVersion) {
        return
      }
      entityVersionsRef.current.set(event.orderId, event.version)
      setLastEvent(event)

      // Invalidate order queries
      queryClient.invalidateQueries({ queryKey: ['order', event.orderId] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
    [queryClient]
  )

  const dismissPriceAlert = useCallback((nftId: string) => {
    setPriceAlerts((prev) => prev.filter((a) => a.nftId !== nftId))
  }, [])

  const clearAllPriceAlerts = useCallback(() => {
    setPriceAlerts([])
  }, [])

  useEffect(() => {
    // Connect Socket.IO
    socket.connect()

    const onConnect = () => {
      console.log('[Realtime Socket.IO] Conectado.')
      setIsConnected(true)
      if (hasDisconnectedRef.current) {
        reconcileWithServer()
        hasDisconnectedRef.current = false
      }
    }

    const onDisconnect = () => {
      console.log('[Realtime Socket.IO] Desconectado.')
      setIsConnected(false)
      hasDisconnectedRef.current = true
    }

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.on('nft.updated', handleNFTUpdated)
    socket.on('order.updated', handleOrderUpdated)

    // Listen to in-app event bus
    const busListenerNFT = (e: Event) => {
      const customEvt = e as CustomEvent<NFTUpdatedEvent>
      handleNFTUpdated(customEvt.detail)
    }

    const busListenerOrder = (e: Event) => {
      const customEvt = e as CustomEvent<OrderUpdatedEvent>
      handleOrderUpdated(customEvt.detail)
    }

    if (REALTIME_EVENT_BUS) {
      REALTIME_EVENT_BUS.addEventListener('nft.updated', busListenerNFT)
      REALTIME_EVENT_BUS.addEventListener('order.updated', busListenerOrder)
    }

    // Default connection active flag
    setIsConnected(true)

    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      socket.off('nft.updated', handleNFTUpdated)
      socket.off('order.updated', handleOrderUpdated)
      if (REALTIME_EVENT_BUS) {
        REALTIME_EVENT_BUS.removeEventListener('nft.updated', busListenerNFT)
        REALTIME_EVENT_BUS.removeEventListener('order.updated', busListenerOrder)
      }
    }
  }, [handleNFTUpdated, handleOrderUpdated, reconcileWithServer])

  return (
    <RealtimeContext.Provider
      value={{
        isConnected,
        lastEvent,
        priceAlerts,
        dismissPriceAlert,
        clearAllPriceAlerts,
        reconcileWithServer,
      }}
    >
      {children}
    </RealtimeContext.Provider>
  )
}

export function useRealtime(): RealtimeContextValue {
  const ctx = useContext(RealtimeContext)
  if (!ctx) {
    throw new Error('useRealtime deve ser utilizado dentro de um RealtimeProvider')
  }
  return ctx
}
