import {
  createRouter,
  createRoute,
  createRootRoute,
  Outlet,
  useSearch,
  useNavigate,
  useParams,
} from '@tanstack/react-router'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { ScenarioBar } from '@/components/layout/ScenarioBar'
import { CartDrawer } from '@/features/cart/CartDrawer'
import { AuthModal } from '@/features/auth/AuthModal'
import { HeroSection } from '@/features/catalog/HeroSection'
import { CatalogGrid } from '@/features/catalog/CatalogGrid'
import { FeaturedSections } from '@/features/catalog/FeaturedSections'
import { NFTDetailsPage } from '@/features/catalog/NFTDetailsPage'
import { CheckoutPage } from '@/features/checkout/CheckoutPage'
import { CartPage } from '@/features/cart/CartPage'
import { ProfilePage } from '@/features/profile/ProfilePage'
import { DocsPage } from '@/docs/DocsPage'
import { CatalogSearchParams, CategoryType, SortOption, StatusFilter } from '@/types'
import { Button } from '@/components/ui/Button'
import { AlertCircle, ArrowLeft } from 'lucide-react'

// 1. Root Route
const rootRoute = createRootRoute({
  component: () => (
    <div className="min-h-screen flex flex-col bg-background text-foreground antialiased selection:bg-primary selection:text-primary-foreground">
      <ScenarioBar />
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <CartDrawer />
      <AuthModal />
    </div>
  ),
  notFoundComponent: () => (
    <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-4">
      <div className="w-16 h-16 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center">
        <AlertCircle className="w-8 h-8" />
      </div>
      <h1 className="text-3xl font-extrabold text-foreground">Página Não Encontrada (404)</h1>
      <p className="text-sm text-foreground-muted">
        O endereço acessado não existe ou foi modificado.
      </p>
      <a href="/" className="inline-block mt-2">
        <Button className="font-bold gap-2">
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Marketplace</span>
        </Button>
      </a>
    </div>
  ),
})

// 2. Index / Home Route
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  validateSearch: (search: Record<string, unknown>): CatalogSearchParams => {
    return {
      search: typeof search.search === 'string' ? search.search : undefined,
      category: typeof search.category === 'string' ? (search.category as CategoryType) : 'all',
      minPrice: typeof search.minPrice === 'string' ? search.minPrice : undefined,
      maxPrice: typeof search.maxPrice === 'string' ? search.maxPrice : undefined,
      status: typeof search.status === 'string' ? (search.status as StatusFilter) : 'all',
      sort: typeof search.sort === 'string' ? (search.sort as SortOption) : 'recent',
      page: Number(search.page) || 1,
      limit: Number(search.limit) || 6,
    }
  },
  component: () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const searchParams = useSearch({ from: '/' })
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const navigate = useNavigate({ from: '/' })

    const handleUpdateParams = (newParams: Partial<CatalogSearchParams>) => {
      navigate({
        search: (prev) => {
          const merged = { ...prev, ...newParams }
          // Clean undefined keys
          Object.keys(merged).forEach((k) => {
            if ((merged as Record<string, unknown>)[k] === undefined) {
              delete (merged as Record<string, unknown>)[k]
            }
          })
          return merged
        },
      })
    }

    return (
      <>
        <HeroSection />
        <CatalogGrid searchParams={searchParams} onUpdateParams={handleUpdateParams} />
        <FeaturedSections />
      </>
    )
  },
})

// 3. NFT Details Route
const nftDetailsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/nft/$nftId',
  component: () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { nftId } = useParams({ from: '/nft/$nftId' })
    return <NFTDetailsPage nftId={nftId} />
  },
})

// 4. Cart Route (Figma Frame 3)
const cartRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/cart',
  component: () => <CartPage />,
})

// 5. Checkout Route
const checkoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/checkout',
  component: () => <CheckoutPage />,
})

// 6. Profile Route
const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/profile',
  validateSearch: (search: Record<string, unknown>): { tab?: string } => {
    return {
      tab: typeof search.tab === 'string' ? search.tab : undefined,
    }
  },
  component: () => <ProfilePage />,
})

// 7. Docs Route (Mandatory Public Hosted Documentation)
const docsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/docs',
  component: () => <DocsPage />,
})

// Assemble Route Tree
const routeTree = rootRoute.addChildren([
  indexRoute,
  nftDetailsRoute,
  cartRoute,
  checkoutRoute,
  profileRoute,
  docsRoute,
])

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
