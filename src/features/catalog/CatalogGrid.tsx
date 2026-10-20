import React, { lazy, Suspense, useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { CatalogResponse, CatalogSearchParams, SortOption } from '@/types'
import { NFTCard } from './NFTCard'
import { NFTSkeletonCard } from '@/components/ui/Skeleton'
import { INITIAL_NFTS } from '@/mocks/fixtures'
import { AlertCircle, RefreshCw, ChevronLeft, ChevronRight, SearchX, Search, ArrowDownUp, SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/features/auth/AuthContext'

const FiltersSidebar = lazy(() => import('./FiltersSidebar').then((module) => ({ default: module.FiltersSidebar })))

interface CatalogGridProps {
  searchParams: CatalogSearchParams
  onUpdateParams: (newParams: Partial<CatalogSearchParams>) => void
}

export const CatalogGrid: React.FC<CatalogGridProps> = ({ searchParams, onUpdateParams }) => {
  const { user } = useAuth()
  const [isDesktop, setIsDesktop] = useState(() => window.matchMedia('(min-width: 1024px)').matches)
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)
  const [mobileSearch, setMobileSearch] = useState(searchParams.search || '')
  const [activeCatalogView, setActiveCatalogView] = useState<'all' | 'new' | 'trending' | null>(() => {
    const sort = searchParams.sort || 'recent'
    return sort === 'popular' ? 'trending' : sort === 'recent' ? 'all' : null
  })

  useEffect(() => {
    setMobileSearch(searchParams.search || '')
  }, [searchParams.search])

  useEffect(() => {
    const desktopQuery = window.matchMedia('(min-width: 1024px)')
    const updateViewport = () => setIsDesktop(desktopQuery.matches)
    desktopQuery.addEventListener('change', updateViewport)
    return () => desktopQuery.removeEventListener('change', updateViewport)
  }, [])

  useEffect(() => {
    const sort = searchParams.sort || 'recent'
    if (sort === 'popular') setActiveCatalogView('trending')
    else if (sort === 'recent') setActiveCatalogView((current) => current === 'new' ? 'new' : 'all')
    else setActiveCatalogView(null)
  }, [searchParams.sort])

  useEffect(() => {
    const openFilters = () => setMobileFilterOpen(true)
    window.addEventListener('kurio:open-catalog-filters', openFilters)
    return () => window.removeEventListener('kurio:open-catalog-filters', openFilters)
  }, [])

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
      const normalizePrice = (value: string) => value.trim().replace(/^["']|["']$/g, '')
      if (searchParams.minPrice) params.set('minPrice', normalizePrice(searchParams.minPrice))
      if (searchParams.maxPrice) params.set('maxPrice', normalizePrice(searchParams.maxPrice))
      if (searchParams.status && searchParams.status !== 'all') params.set('status', searchParams.status)
      if (searchParams.sort) params.set('sort', searchParams.sort)
      params.set('page', String(searchParams.page || 1))
      params.set('limit', String(searchParams.limit || 9))

      const response = await api.get<CatalogResponse>(`/nfts?${params.toString()}`)
      return response.data
    },
    staleTime: 1000 * 30,
    placeholderData: () => {
      const hasDefaultCatalogFilters =
        !searchParams.search &&
        !searchParams.minPrice &&
        !searchParams.maxPrice &&
        (!searchParams.category || searchParams.category === 'all') &&
        (!searchParams.status || searchParams.status === 'all') &&
        (!searchParams.sort || searchParams.sort === 'recent') &&
        (searchParams.page || 1) === 1

      if (!hasDefaultCatalogFilters) return undefined

      const items = [...INITIAL_NFTS]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, searchParams.limit || 9)
        .map((item) => ({ ...item, isLiked: false }))
      const availablePrices = INITIAL_NFTS
        .filter((item) => !item.isSoldOut && item.availableSupply > 0)
        .map((item) => Number(item.price))

      return {
        items,
        total: INITIAL_NFTS.length,
        page: 1,
        totalPages: Math.ceil(INITIAL_NFTS.length / (searchParams.limit || 9)) || 1,
        limit: searchParams.limit || 9,
        maxAvailablePrice: Math.max(0.02, ...availablePrices).toFixed(2),
      }
    },
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
    <div className="max-w-[1264px] mx-auto px-6 pt-2 pb-10 lg:px-8 lg:pt-10 lg:pb-[118px]">
      <div className="flex gap-12">
        {/* Desktop Sidebar */}
        {(isDesktop || mobileFilterOpen) && (
          <Suspense fallback={isDesktop ? <div className="w-[310px] flex-shrink-0" aria-hidden="true" /> : null}>
            <FiltersSidebar
              filters={searchParams}
              maxAvailablePrice={data?.maxAvailablePrice}
              onFilterChange={onUpdateParams}
              onClearFilters={handleClearFilters}
              totalCount={total}
              isMobileDrawerOpen={!isDesktop && mobileFilterOpen}
              onCloseMobileDrawer={() => setMobileFilterOpen(false)}
            />
          </Suspense>
        )}

        {/* Main Catalog View */}
        <div className="flex-1 min-w-0">
          {/* Mobile Quick Search Bar */}
          <div className="hidden md:flex lg:hidden mb-4">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                onUpdateParams({ search: mobileSearch.trim() || undefined, page: 1 })
              }}
              className="relative"
            >
              <label htmlFor="catalog-inline-search" className="sr-only">Nome, coleção</label>
              <Input
                id="catalog-inline-search"
                type="text"
                aria-label="Nome, coleção"
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

          {/* Top Control Bar with Figma Tabs */}
          <div className="flex items-center justify-between gap-2 pb-2 mb-3 border-b border-border md:flex-wrap md:gap-x-2 md:gap-y-2 lg:flex-nowrap lg:gap-4 lg:pb-4 lg:mb-4">
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setMobileFilterOpen(true)}
                aria-label="Filtros"
                className="hidden h-9 shrink-0 items-center gap-2 rounded-md border-border bg-surface px-3 text-xs font-semibold text-foreground md:flex lg:hidden"
              >
                <SlidersHorizontal className="h-4 w-4 text-primary" aria-hidden="true" />
                <span className="sr-only">Filtros</span>
              </Button>

              {/* View Tabs matching Figma */}
              <div className="flex min-w-0 items-center gap-1 sm:gap-4">
                {[
                  { id: 'all', label: 'Todos os NFTs', sort: 'recent' },
                  { id: 'new', label: 'Novos lançamentos', sort: 'recent' },
                  { id: 'trending', label: 'Em alta', sort: 'popular' },
                ].map((tab) => {
                  const isActive = activeCatalogView === tab.id
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        setActiveCatalogView(tab.id as 'all' | 'new' | 'trending')
                        onUpdateParams({ sort: tab.sort as SortOption, page: 1 })
                      }}
                      aria-pressed={isActive}
                      className={`relative whitespace-nowrap px-1.5 py-1 text-xs sm:px-3 sm:text-sm font-bold transition-all ${
                        isActive
                          ? "text-primary after:absolute after:inset-x-1 after:bottom-0 after:h-0.5 after:bg-primary after:content-['']"
                          : 'text-foreground-muted hover:text-foreground'
                      }`}
                    >
                      {tab.label}
                    </button>
                  )
                })}
              </div>

              <p className="sr-only">
                Exibindo <strong className="text-foreground">{startIdx} - {endIdx}</strong> de{' '}
                <strong className="text-foreground">{total}</strong> obras
              </p>
            </div>

            {/* Sort Dropdown */}
            <div className="relative flex shrink-0 items-center gap-2 self-auto">
              <label htmlFor="sort-select" className="sr-only lg:not-sr-only lg:text-xs lg:text-foreground-muted lg:whitespace-nowrap">
                Ordenar por:
              </label>
              <select
                id="sort-select"
                value={searchParams.sort || 'recent'}
                onChange={(e) => onUpdateParams({ sort: e.target.value as SortOption, page: 1 })}
                className="h-8 w-8 appearance-none overflow-hidden rounded-md border-0 bg-transparent px-0 text-transparent sm:h-9 sm:w-[170px] sm:appearance-auto sm:border sm:bg-surface sm:px-3 sm:text-xs sm:text-foreground lg:w-auto font-medium focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="recent">Listados recentemente</option>
                <option value="price_asc">Menor Preço (ETH)</option>
                <option value="price_desc">Maior Preço (ETH)</option>
                <option value="popular">Em alta</option>
              </select>
              <ArrowDownUp className="pointer-events-none absolute right-4 h-3.5 w-3.5 text-foreground-muted sm:hidden" aria-hidden="true" />
            </div>
          </div>

          {/* Loading Skeletons */}
          {isLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6" aria-busy="true">
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
              <div id="catalog-grid" data-testid="catalog-grid" className="grid grid-cols-2 lg:grid-cols-3 gap-x-3 gap-y-3 sm:gap-x-6 sm:gap-y-6 lg:gap-y-[52px]">
                {items.map((nft, index) => (
                  <NFTCard key={nft.id} nft={nft} priority={index === 0} />
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
                    <span className="hidden">Anterior</span>
                  </Button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <Button
                        key={p}
                        variant={p === page ? 'default' : 'outline'}
                        size="icon-sm"
                        onClick={() => onUpdateParams({ page: p })}
                        disabled={isFetching}
                        aria-current={p === page ? 'page' : undefined}
                        className={`w-8 h-8 rounded-md text-xs font-semibold ${
                          p === page
                            ? 'font-bold shadow-sm'
                            : 'bg-surface text-foreground hover:bg-surface-secondary border-border'
                        }`}
                      >
                        {p}
                      </Button>
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
                    <span className="hidden">Próxima</span>
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
