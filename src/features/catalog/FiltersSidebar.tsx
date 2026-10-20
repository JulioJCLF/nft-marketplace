import React, { useEffect, useState } from 'react'
import { Filter, X, Search } from 'lucide-react'
import * as Slider from '@radix-ui/react-slider'
import { CategoryType, StatusFilter, CatalogSearchParams } from '@/types'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Link } from '@tanstack/react-router'
import { getNFTImageSrcSet } from '@/lib/nftImage'

interface FiltersSidebarProps {
  filters: CatalogSearchParams
  maxAvailablePrice?: string
  onFilterChange: (newFilters: Partial<CatalogSearchParams>) => void
  onClearFilters: () => void
  totalCount?: number
  isMobileDrawerOpen?: boolean
  onCloseMobileDrawer?: () => void
}

const CATEGORIES: Array<{ id: CategoryType; label: string; count?: number }> = [
  { id: 'art', label: 'Arte digital', count: 33 },
  { id: 'photography', label: 'Fotografia', count: 12 },
  { id: 'music', label: 'Música', count: 65 },
  { id: 'metaverse', label: 'Arte 3D', count: 39 },
  { id: 'collectibles', label: 'Colecionáveis', count: 23 },
  { id: 'generative', label: 'Generativa', count: 17 },
  { id: 'gaming', label: 'Jogos', count: 19 },
  { id: 'subscriptions', label: 'Assinaturas', count: 13 },
  { id: 'utility', label: 'Utilidade', count: 18 },
]

const NETWORKS = [
  { label: 'Ethereum', count: 119 },
  { label: 'Polygon', count: 78 },
  { label: 'Solana', count: 86 },
]

const DEFAULT_PRICE_RANGE: [number, number] = [0.02, 12.3]

const parsePrice = (value: string | undefined, fallback: number) => {
  const normalized = value?.trim().replace(/^['"]|['"]$/g, '')
  const parsed = normalized ? Number(normalized) : NaN
  return Number.isFinite(parsed) ? parsed : fallback
}

export const FiltersSidebar: React.FC<FiltersSidebarProps> = ({
  filters,
  maxAvailablePrice,
  onFilterChange,
  onClearFilters,
  isMobileDrawerOpen,
  onCloseMobileDrawer,
}) => {
  const [priceRange, setPriceRange] = useState<[number, number]>(() => [
    parsePrice(filters.minPrice, DEFAULT_PRICE_RANGE[0]),
    parsePrice(filters.maxPrice, DEFAULT_PRICE_RANGE[1]),
  ])
  const [searchInput, setSearchInput] = useState(filters.search || '')

  useEffect(() => {
    const availableMax = parsePrice(maxAvailablePrice, DEFAULT_PRICE_RANGE[1])
    const min = parsePrice(filters.minPrice, DEFAULT_PRICE_RANGE[0])
    const max = parsePrice(filters.maxPrice, availableMax)
    setPriceRange([
      Math.min(min, availableMax),
      Math.max(Math.min(max, availableMax), Math.min(min, availableMax) + 0.01),
    ])
  }, [filters.minPrice, filters.maxPrice, maxAvailablePrice])

  const sliderMax = Math.max(parsePrice(maxAvailablePrice, DEFAULT_PRICE_RANGE[1]), 0.03)

  const handleApplyPrice = () => {
    onFilterChange({
      minPrice: priceRange[0].toFixed(2),
      maxPrice: priceRange[1].toFixed(2),
      page: 1,
    })
  }

  const formatPrice = (price: number) =>
    price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onFilterChange({
      search: searchInput.trim() || undefined,
      page: 1,
    })
  }

  const content = (
    <div className="space-y-5 text-sm">
      {/* Categories Filter */}
      <div>
        <label className="block text-xs font-bold text-foreground mb-2">
          Coleções
        </label>
        <div className="space-y-0.5">
          {CATEGORIES.map((cat) => {
            const isSelected = (filters.category || 'all') === cat.id
            return (
              <button
                key={cat.id}
                onClick={() => onFilterChange({ category: cat.id, page: 1 })}
                aria-label={cat.label}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors text-left ${
                  isSelected
                  ? 'text-primary font-bold'
                    : 'text-foreground-muted hover:text-foreground'
                }`}
              >
                <span>{cat.label}</span>
                {cat.count !== undefined && (
                <span aria-hidden="true" className={`text-[11px] font-mono ${isSelected ? 'text-primary font-bold' : 'text-foreground-muted'}`}>
                    ({cat.count})
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Price Range Filter */}
      <div>
        <label className="block text-xs font-bold text-foreground mb-2">
          Faixa de preço
        </label>
        <div className="space-y-2">
          <Slider.Root
            aria-label="Faixa de preço em ETH"
            min={0.02}
            max={Math.max(sliderMax, priceRange[1])}
            step={0.01}
            minStepsBetweenThumbs={1}
            value={priceRange}
            onValueChange={(value) => setPriceRange([value[0], value[1]])}
            className="relative flex h-4 w-full touch-none select-none items-center"
          >
            <Slider.Track className="relative h-[3px] grow rounded-full bg-[#593c2b]">
              <Slider.Range className="absolute h-full rounded-full bg-primary" />
            </Slider.Track>
            <Slider.Thumb
              aria-label="Preço mínimo"
              className="block h-[11px] w-[11px] rounded-full border-2 border-[#382317] bg-primary shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            />
            <Slider.Thumb
              aria-label="Preço máximo"
              className="block h-[11px] w-[11px] rounded-full border-2 border-[#382317] bg-primary shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            />
          </Slider.Root>
          <p className="font-mono text-[11px] text-foreground-muted">
            Preço: {formatPrice(priceRange[0])} - {formatPrice(priceRange[1])} ETH
          </p>
          <Button type="button" onClick={handleApplyPrice} size="sm" className="h-9 rounded-md px-4 text-xs font-bold">
            Aplicar
          </Button>
        </div>
      </div>

      {/* Network summary matching the reference sidebar */}
      <div>
        <label className="block text-xs font-bold text-foreground mb-2">Rede</label>
        <div className="space-y-0.5">
          {NETWORKS.map((network) => (
            <div key={network.label} className="flex items-center justify-between px-3 py-2 text-xs text-foreground-muted">
              <span>{network.label}</span>
              <span className="font-mono text-[11px]">({network.count})</span>
            </div>
          ))}
        </div>
      </div>

      <Link to="/nft/$nftId" params={{ nftId: 'bored-ape-8817' }} className="block overflow-hidden bg-[#241610] text-center">
        <span className="block px-2 pt-3 text-xs font-bold tracking-wide text-primary">NFT EM DESTAQUE</span>
        <span className="block px-2 pt-1 text-[10px] font-bold text-foreground">OFERTA LIMITADA</span>
        <img src="/nfts/figma/img1_2986.avif" srcSet={getNFTImageSrcSet('/nfts/figma/img1_2986.avif')} sizes="280px" alt="NFT em destaque" loading="lazy" className="mt-2 aspect-[0.85] w-full object-cover" />
      </Link>

      <details className="group border-t border-border/60 pt-3">
        <summary className="cursor-pointer list-none text-xs font-semibold text-foreground-muted marker:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
          Opções adicionais
        </summary>
        <div className="mt-4 space-y-5">
          {/* Search remains available while staying out of the reference layout */}
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-foreground-muted">
              Buscar NFT
            </label>
            <form onSubmit={handleSearchSubmit} className="relative">
              <Input
                type="text"
                aria-label="Nome, coleção"
                placeholder="Nome, coleção..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="h-10 pr-10 text-xs"
              />
              <button
                type="submit"
                className="absolute right-1 top-1 flex h-8 w-8 items-center justify-center rounded text-foreground-muted transition-colors hover:text-primary focus:outline-none focus:ring-1 focus:ring-primary"
                aria-label="Buscar"
              >
                <Search className="h-4 w-4" />
              </button>
            </form>
          </div>

          {/* Status Filter */}
          <div>
            <label className="mb-2 block text-xs font-bold text-foreground">
              Disponibilidade
            </label>
            <div className="space-y-1.5">
              {[
                { id: 'all', label: 'Todos os Status' },
                { id: 'available', label: 'Apenas Disponíveis' },
                { id: 'sold_out', label: 'Esgotados' },
              ].map((item) => {
                const isSelected = (filters.status || 'all') === item.id
                return (
                  <label
                    key={item.id}
                    className="flex cursor-pointer items-center gap-2.5 rounded px-2 py-1.5 text-xs hover:bg-surface-secondary"
                  >
                    <input
                      type="radio"
                      name="status_filter"
                      checked={isSelected}
                      onChange={() => onFilterChange({ status: item.id as StatusFilter, page: 1 })}
                      className="accent-primary"
                    />
                    <span className={isSelected ? 'font-semibold text-foreground' : 'text-foreground-muted'}>
                      {item.label}
                    </span>
                  </label>
                )
              })}
            </div>
          </div>

          {/* Clear Filters Button */}
          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setPriceRange(DEFAULT_PRICE_RANGE)
                setSearchInput('')
                onClearFilters()
              }}
              className="w-full gap-2 text-xs"
            >
              <X className="h-3.5 w-3.5" />
              <span>Limpar Todos os Filtros</span>
            </Button>
          </div>
        </div>
      </details>
    </div>
  )

  // Desktop sidebar
  return (
    <>
      <aside className="hidden lg:block w-[310px] flex-shrink-0">
        <div className="p-5 rounded-xl border border-border bg-surface shadow-sm sticky top-28">
          {content}
        </div>
      </aside>

      {/* Mobile Drawer */}
      {isMobileDrawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onCloseMobileDrawer}
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 left-0 max-w-full flex">
            <div className="w-screen max-w-xs bg-surface border-r border-border p-6 overflow-y-auto">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-border">
                <div className="flex items-center gap-2 font-bold text-foreground">
                  <Filter className="w-4 h-4 text-primary" />
                  <span>Coleções</span>
                </div>
                <button
                  onClick={onCloseMobileDrawer}
                  className="p-1 rounded-md text-foreground-muted hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              {content}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
