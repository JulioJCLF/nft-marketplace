import React, { useState } from 'react'
import { Filter, X, SlidersHorizontal, Search } from 'lucide-react'
import { CategoryType, StatusFilter, CatalogSearchParams } from '@/types'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface FiltersSidebarProps {
  filters: CatalogSearchParams
  onFilterChange: (newFilters: Partial<CatalogSearchParams>) => void
  onClearFilters: () => void
  totalCount?: number
  isMobileDrawerOpen?: boolean
  onCloseMobileDrawer?: () => void
}

const CATEGORIES: Array<{ id: CategoryType; label: string; count?: number }> = [
  { id: 'all', label: 'Todas as Categorias' },
  { id: 'art', label: 'Arte Digital' },
  { id: 'collectibles', label: 'Colecionáveis' },
  { id: 'music', label: 'Música & Áudio' },
  { id: 'metaverse', label: 'Metaverso' },
  { id: 'gaming', label: 'Jogos Web3' },
]

export const FiltersSidebar: React.FC<FiltersSidebarProps> = ({
  filters,
  onFilterChange,
  onClearFilters,
  isMobileDrawerOpen,
  onCloseMobileDrawer,
}) => {
  const [minPriceInput, setMinPriceInput] = useState(filters.minPrice || '')
  const [maxPriceInput, setMaxPriceInput] = useState(filters.maxPrice || '')
  const [searchInput, setSearchInput] = useState(filters.search || '')

  const handleApplyPrice = (e: React.FormEvent) => {
    e.preventDefault()
    onFilterChange({
      minPrice: minPriceInput.trim() || undefined,
      maxPrice: maxPriceInput.trim() || undefined,
      page: 1,
    })
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onFilterChange({
      search: searchInput.trim() || undefined,
      page: 1,
    })
  }

  const content = (
    <div className="space-y-6 text-sm">
      {/* Search Input Filter */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-foreground-muted mb-2">
          Buscar NFT
        </label>
        <form onSubmit={handleSearchSubmit} className="relative">
          <Input
            type="text"
            placeholder="Nome, coleção..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pr-10 h-10 text-xs"
          />
          <button
            type="submit"
            className="absolute right-1 top-1 w-8 h-8 flex items-center justify-center rounded text-foreground-muted hover:text-primary transition-colors focus:outline-none focus:ring-1 focus:ring-primary"
            aria-label="Buscar"
          >
            <Search className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Categories Filter */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-foreground-muted mb-2">
          Categorias
        </label>
        <div className="space-y-1">
          {CATEGORIES.map((cat) => {
            const isSelected = (filters.category || 'all') === cat.id
            return (
              <button
                key={cat.id}
                onClick={() => onFilterChange({ category: cat.id, page: 1 })}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors text-left ${
                  isSelected
                    ? 'bg-primary text-primary-foreground font-bold shadow-sm'
                    : 'text-foreground hover:bg-surface-secondary text-foreground-muted hover:text-foreground'
                }`}
              >
                <span>{cat.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Price Range Filter */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-foreground-muted mb-2">
          Preço (ETH)
        </label>
        <form onSubmit={handleApplyPrice} className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Input
                type="number"
                step="0.01"
                placeholder="Mínimo"
                value={minPriceInput}
                onChange={(e) => setMinPriceInput(e.target.value)}
                className="h-9 text-xs font-mono"
              />
            </div>
            <div>
              <Input
                type="number"
                step="0.01"
                placeholder="Máximo"
                value={maxPriceInput}
                onChange={(e) => setMaxPriceInput(e.target.value)}
                className="h-9 text-xs font-mono"
              />
            </div>
          </div>
          <Button type="submit" variant="secondary" size="sm" className="w-full text-xs">
            Aplicar Filtro de Preço
          </Button>
        </form>
      </div>

      {/* Status Filter */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-foreground-muted mb-2">
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
                className="flex items-center gap-2.5 px-2 py-1.5 rounded hover:bg-surface-secondary cursor-pointer text-xs"
              >
                <input
                  type="radio"
                  name="status_filter"
                  checked={isSelected}
                  onChange={() => onFilterChange({ status: item.id as StatusFilter, page: 1 })}
                  className="accent-primary"
                />
                <span className={isSelected ? 'text-foreground font-semibold' : 'text-foreground-muted'}>
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
            setMinPriceInput('')
            setMaxPriceInput('')
            setSearchInput('')
            onClearFilters()
          }}
          className="w-full gap-2 text-xs"
        >
          <X className="w-3.5 h-3.5" />
          <span>Limpar Todos os Filtros</span>
        </Button>
      </div>
    </div>
  )

  // Desktop sidebar
  return (
    <>
      <aside className="hidden lg:block w-64 flex-shrink-0">
        <div className="p-5 rounded-xl border border-border bg-surface shadow-sm sticky top-28">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-border">
            <div className="flex items-center gap-2 font-bold text-foreground">
              <SlidersHorizontal className="w-4 h-4 text-primary" />
              <span>Filtros</span>
            </div>
          </div>
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
                  <span>Filtros do Catálogo</span>
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
