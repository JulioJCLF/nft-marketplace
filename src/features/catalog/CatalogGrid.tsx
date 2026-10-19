import React, { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { CatalogResponse, CatalogSearchParams, SortOption } from '@/types'
import { NFTCard } from './NFTCard'
import { NFTSkeletonCard } from '@/components/ui/Skeleton'
import { FiltersSidebar } from './FiltersSidebar'
import { SlidersHorizontal, AlertCircle, RefreshCw, ChevronLeft, ChevronRight, SearchX, Search } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/features/auth/AuthContext'

interface CatalogGridProps {
  searchParams: CatalogSearchParams
  onUpdateParams: (newParams: Partial<CatalogSearchParams>) => void
}

export const CatalogGrid: React.FC<CatalogGridProps> = ({ searchParams, onUpdateParams }) => {
  const { user } = useAuth()
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)
  const [mobileSearch, setMobileSearch] = useState(searchParams.search || '')

  useEffect(() => {
    setMobileSearch(searchParams.search || '')
  }, [searchParams.search])

  // Query Catalog via TanStack Query
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery<CatalogResponse>({
    queryKey: ['nfts', searchParams, user?.id || 'anonymous'],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (searchParams.search) params.set('search', searchParams.search)
      if (searchParams.category && searchParams.category !== 'all') params.set('category', searchParams.category)
      if (searchParams.minPrice) params.set('minPrice', searchParams.minPrice)
      if (searchParams.maxPrice) params.set('maxPrice', searchParams.maxPrice)
      if (searchParams.status && searchParams.status !== 'all') params.set('status', searchParams.status)
      if (searchParams.sort) params.set('sort', searchParams.sort)
      params.set('page', String(searchParams.page || 1))
      params.set('limit', String(searchParams.limit || 6))

      const response = await api.get<CatalogResponse>(`/nfts?${params.toString()}`)
      return response.data
    },
    staleTime: 1000 * 30,
  })

  const handleClearFilters = () => {
    onUpdateParams({
      search: undefined,
      category: 'all',
      minPrice: undefined,
      maxPrice: undefined,
      status: 'all',
      page: 1,
    })
  }

  const items = data?.items || []
  const total = data?.total || 0
  const page = data?.page || 1
  const totalPages = data?.totalPages || 1
  const limit = data?.limit || 6

  const startIdx = total === 0 ? 0 : (page - 1) * limit + 1
  const endIdx = Math.min(page * limit, total)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex gap-8">
        {/* Desktop Sidebar */}
        <FiltersSidebar
          filters={searchParams}
          onFilterChange={onUpdateParams}
          onClearFilters={handleClearFilters}
          totalCount={total}
          isMobileDrawerOpen={mobileFilterOpen}
          onCloseMobileDrawer={() => setMobileFilterOpen(false)}
        />

        {/* Main Catalog View */}
        <div className="flex-1 min-w-0">
          {/* Mobile Quick Search Bar */}
          <div className="lg:hidden mb-4">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                onUpdateParams({ search: mobileSearch.trim() || undefined, page: 1 })
              }}
              className="relative"
            >
              <Input
                type="text"
                placeholder="Nome, coleção..."
                value={mobileSearch}
                onChange={(e) => setMobileSearch(e.target.value)}
                className="pr-10 h-10 text-xs w-full bg-surface"
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

          {/* Top Control Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-border">
            <div className="flex items-center gap-3">
              {/* Mobile Filter Drawer Trigger */}
              <button
                onClick={() => setMobileFilterOpen(true)}
                className="lg:hidden flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-surface hover:bg-surface-secondary text-xs font-semibold text-foreground"
              >
                <SlidersHorizontal className="w-4 h-4 text-primary" />
                <span>Filtros</span>
              </button>

              <p className="text-xs sm:text-sm text-foreground-muted">
                Exibindo <strong className="text-foreground">{startIdx} - {endIdx}</strong> de{' '}
                <strong className="text-foreground">{total}</strong> obras digitais
              </p>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <label htmlFor="sort-select" className="text-xs text-foreground-muted whitespace-nowrap">
                Ordenar por:
              </label>
              <select
                id="sort-select"
                value={searchParams.sort || 'recent'}
                onChange={(e) => onUpdateParams({ sort: e.target.value as SortOption, page: 1 })}
                className="h-9 rounded-md border border-border bg-surface px-3 text-xs text-foreground font-medium focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="recent">Mais Recentes</option>
                <option value="price_asc">Menor Preço (ETH)</option>
                <option value="price_desc">Maior Preço (ETH)</option>
                <option value="popular">Mais Populares</option>
              </select>
            </div>
          </div>

          {/* Loading Skeletons */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6" aria-busy="true">
              {Array.from({ length: 6 }).map((_, i) => (
                <NFTSkeletonCard key={i} />
              ))}
            </div>
          ) : isError ? (
            /* Error State */
            <div className="p-10 rounded-xl border border-red-500/20 bg-red-500/5 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-400 mx-auto flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-foreground text-base">Falha ao carregar catálogo</h3>
                <p className="text-xs text-foreground-muted mt-1">
                  {(error as Error)?.message || 'Ocorreu um erro inesperado ao consultar os NFTs.'}
                </p>
              </div>
              <Button onClick={() => refetch()} variant="outline" size="sm" className="gap-2">
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Tentar Novamente</span>
              </Button>
            </div>
          ) : items.length === 0 ? (
            /* Empty State */
            <div className="p-12 rounded-xl border border-border bg-surface/50 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-surface-secondary text-foreground-muted mx-auto flex items-center justify-center">
                <SearchX className="w-8 h-8 opacity-40" />
              </div>
              <div>
                <h3 className="font-bold text-foreground text-lg">Nenhum NFT encontrado</h3>
                <p className="text-xs sm:text-sm text-foreground-muted mt-1 max-w-md mx-auto">
                  Não encontramos nenhuma obra com os filtros selecionados. Tente ajustar a busca ou redefinir os parâmetros.
                </p>
              </div>
              <Button onClick={handleClearFilters} variant="default" size="sm" className="font-bold">
                Limpar Todos os Filtros
              </Button>
            </div>
          ) : (
            /* NFT Cards Grid */
            <>
              <div id="catalog-grid" data-testid="catalog-grid" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {items.map((nft) => (
                  <NFTCard key={nft.id} nft={nft} />
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <nav
                  aria-label="Paginação do catálogo"
                  className="flex items-center justify-center gap-2 pt-10 mt-6 border-t border-border"
                >
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onUpdateParams({ page: Math.max(1, page - 1) })}
                    disabled={page <= 1 || isFetching}
                    aria-label="Página anterior"
                    className="gap-1 px-3"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">Anterior</span>
                  </Button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        onClick={() => onUpdateParams({ page: p })}
                        disabled={isFetching}
                        aria-current={p === page ? 'page' : undefined}
                        className={`w-9 h-9 rounded-md text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary ${
                          p === page
                            ? 'bg-primary text-primary-foreground font-bold shadow-sm'
                            : 'bg-surface text-foreground hover:bg-surface-secondary border border-border'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onUpdateParams({ page: Math.min(totalPages, page + 1) })}
                    disabled={page >= totalPages || isFetching}
                    aria-label="Próxima página"
                    className="gap-1 px-3"
                  >
                    <span className="hidden sm:inline">Próxima</span>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </nav>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
