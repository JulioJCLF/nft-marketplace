import React, { useState } from 'react'
import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import { ShoppingCart, User, LogIn, LogOut, Wallet, Menu, X, Heart, Package, Search, SlidersHorizontal } from 'lucide-react'
import { useAuth } from '@/features/auth/AuthContext'
import { useCart } from '@/features/cart/CartContext'
import { Button } from '@/components/ui/Button'

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout, setAuthModalOpen, setAuthModalMode } = useAuth()
  const { itemCount, setIsCartDrawerOpen } = useCart()
  const navigate = useNavigate()
  const currentPath = useRouterState({ select: (state) => state.location.pathname })
  const currentHash = useRouterState({ select: (state) => state.location.hash })
  const currentSearchString = useRouterState({ select: (state) => state.location.searchStr })
  const currentCategory = new URLSearchParams(currentSearchString).get('category') ?? 'all'
  const isCreatorsActive = currentPath === '/' && currentCategory === 'art'
  const isCatalogHash = currentHash.replace(/^#/, '') === 'catalog-grid'
  const isMarketActive = currentPath === '/' && !isCreatorsActive && (isCatalogHash || currentCategory !== 'all')
  const isHomeActive = currentPath === '/' && !isCreatorsActive && !isMarketActive
  const isLearnActive = currentPath === '/docs'
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const [mobileSearch, setMobileSearch] = useState('')

  const handleOpenAuth = (mode: 'login' | 'register') => {
    setAuthModalMode(mode)
    setAuthModalOpen(true)
    setMobileMenuOpen(false)
  }

  const handleLogout = async () => {
    setUserDropdownOpen(false)
    setMobileMenuOpen(false)
    await logout()
    navigate({ to: '/' })
  }

  return (
    <header className={`sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur-md ${currentPath === '/' ? 'border-b-0 md:border-b' : ''}`}>
      <div className={`relative max-w-[1264px] mx-auto px-6 md:px-8 h-[70px] items-center justify-between gap-4 ${currentPath === '/' ? 'h-[84px] !items-end md:h-[68px] md:!items-center' : 'md:h-[68px]'} ${currentPath.startsWith('/nft/') ? 'hidden lg:flex' : 'flex'}`}>
        {/* Brand / Logo */}
        <Link to="/" className={`flex items-center group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded ${currentPath === '/' ? 'hidden md:flex' : ''}`}>
          <span className="font-bold text-sm tracking-[0.12em] text-foreground font-mono leading-none group-hover:text-primary transition-colors">
            KURIO
          </span>
        </Link>

        {currentPath === '/' && (
          <form
            className="md:hidden flex flex-1 items-center gap-2"
            onSubmit={(event) => {
              event.preventDefault()
              navigate({ to: '/', search: (previous) => ({ ...previous, search: mobileSearch.trim() || undefined, page: 1 }) })
            }}
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted" />
              <input
                type="search"
                aria-label="Nome, coleção"
                placeholder="Explorar coleções"
                value={mobileSearch}
                onChange={(event) => setMobileSearch(event.target.value)}
                className="h-11 w-full rounded-[12px] bg-surface px-10 text-xs text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event('kurio:open-catalog-filters'))}
              aria-label="Filtros"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-primary text-primary-foreground"
            >
              <SlidersHorizontal className="h-4 w-4" />
            </button>
          </form>
        )}

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium lg:absolute lg:left-[calc(50%-24px)] lg:top-0 lg:h-full lg:-translate-x-1/2 lg:gap-10 lg:text-base">
          <Link
            to="/"
            search={{ category: 'all', status: 'all', sort: 'recent', page: 1, limit: 9 }}
            hash=""
            activeOptions={{ exact: true, includeSearch: true, includeHash: true }}
            hashScrollIntoView={false}
            aria-current={isHomeActive ? 'page' : 'false'}
            className={`pb-1 transition-colors lg:relative lg:flex lg:h-full lg:items-center lg:pb-0 ${isHomeActive ? 'text-primary font-bold border-b-2 border-primary lg:border-b-0 lg:after:absolute lg:after:bottom-0 lg:after:left-0 lg:after:right-0 lg:after:h-[3px] lg:after:bg-primary' : 'text-foreground-muted hover:text-foreground'}`}
          >
            Início
          </Link>
          <Link
            to="/"
            search={{ category: 'all' }}
            hash="catalog-grid"
            activeOptions={{ exact: true, includeSearch: true, includeHash: true }}
            hashScrollIntoView={false}
            aria-current={isMarketActive ? 'page' : 'false'}
            className={`pb-1 transition-colors lg:relative lg:flex lg:h-full lg:items-center lg:pb-0 ${isMarketActive ? 'text-primary font-bold border-b-2 border-primary lg:border-b-0 lg:after:absolute lg:after:bottom-0 lg:after:left-0 lg:after:right-0 lg:after:h-[3px] lg:after:bg-primary' : 'text-foreground-muted hover:text-foreground'}`}
          >
            Mercado
          </Link>
          <Link
            to="/"
            search={{ category: 'art' }}
            hash="catalog-grid"
            activeOptions={{ exact: true, includeSearch: true, includeHash: true }}
            hashScrollIntoView={false}
            aria-current={isCreatorsActive ? 'page' : 'false'}
            className={`pb-1 transition-colors lg:relative lg:flex lg:h-full lg:items-center lg:pb-0 ${isCreatorsActive ? 'text-primary font-bold border-b-2 border-primary lg:border-b-0 lg:after:absolute lg:after:bottom-0 lg:after:left-0 lg:after:right-0 lg:after:h-[3px] lg:after:bg-primary' : 'text-foreground-muted hover:text-foreground'}`}
          >
            Criadores
          </Link>
          <Link
            to="/docs"
            activeOptions={{ exact: true, includeSearch: true, includeHash: true }}
            hashScrollIntoView={false}
            aria-current={isLearnActive ? 'page' : 'false'}
            className={`flex items-center pb-1 transition-colors lg:flex lg:h-full lg:items-center lg:pb-0 lg:relative ${isLearnActive ? 'font-bold text-primary lg:after:absolute lg:after:bottom-0 lg:after:left-0 lg:after:right-0 lg:after:h-[3px] lg:after:bg-primary' : 'text-foreground-muted hover:text-foreground'}`}
          >
            <span>Aprenda</span>
          </Link>
        </nav>

        {/* Right Action Icons & Auth */}
        <div className="flex items-center gap-3 lg:gap-5">
          {/* Quick Search Link */}
          <Link
            to="/"
            search={{ category: 'all' }}
            className="hidden h-8 w-8 items-center justify-center text-foreground transition-colors hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary md:flex"
            aria-label="Buscar NFTs"
          >
            <Search className="h-5 w-5" />
          </Link>

          {/* Cart Trigger */}
          <button
            onClick={() => setIsCartDrawerOpen(true)}
            className={`relative flex h-8 w-8 items-center justify-center text-foreground transition-colors hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${currentPath === '/' ? 'hidden md:flex' : ''}`}
            aria-label={`Abrir carrinho com ${itemCount} itens`}
          >
            <ShoppingCart className="h-5 w-5" />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground shadow-sm animate-in zoom-in-50">
                {itemCount}
              </span>
            )}
          </button>

          {/* User Account / Connect Button */}
          {isAuthenticated && user ? (
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                data-testid="navbar-user-menu"
                aria-label={`Menu de ${user.name}`}
                className="flex items-center gap-2 p-1.5 rounded-lg border border-border bg-surface hover:bg-surface-secondary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-expanded={userDropdownOpen}
                aria-haspopup="menu"
              >
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-7 h-7 rounded-full bg-surface-tertiary object-cover border border-primary/40"
                />
                <span data-testid="navbar-user-name" className="hidden sm:inline text-xs font-semibold text-foreground max-w-[100px] truncate">
                  {user.name}
                </span>
              </button>

              {/* Dropdown Menu */}
              {userDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 rounded-lg border border-border bg-surface shadow-2xl py-2 z-50 text-xs animate-in fade-in-80"
                  role="menu"
                >
                  <div className="px-4 py-2 border-b border-border/60">
                    <p className="font-bold text-foreground truncate">{user.name}</p>
                    <p className="text-foreground-muted truncate text-[11px]">{user.email}</p>
                  </div>

                  <Link
                    to="/profile"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-foreground hover:bg-surface-secondary transition-colors"
                    role="menuitem"
                  >
                    <User className="w-4 h-4 text-primary" />
                    <span>Meu Perfil</span>
                  </Link>

                  <Link
                    to="/profile"
                    search={{ tab: 'wallets' }}
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-foreground hover:bg-surface-secondary transition-colors"
                    role="menuitem"
                  >
                    <Wallet className="w-4 h-4 text-primary" />
                    <span>Carteiras Conectadas</span>
                  </Link>

                  <Link
                    to="/profile"
                    search={{ tab: 'orders' }}
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-foreground hover:bg-surface-secondary transition-colors"
                    role="menuitem"
                  >
                    <Package className="w-4 h-4 text-primary" />
                    <span>Meus Pedidos</span>
                  </Link>

                  <Link
                    to="/profile"
                    search={{ tab: 'favorites' }}
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-foreground hover:bg-surface-secondary transition-colors"
                    role="menuitem"
                  >
                    <Heart className="w-4 h-4 text-red-400" />
                    <span>Favoritos</span>
                  </Link>

                  <div className="border-t border-border/60 mt-1 pt-1">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-red-400 hover:bg-red-500/10 transition-colors text-left"
                      role="menuitem"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sair da Conta</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className={`flex items-center gap-2 ${currentPath === '/' ? 'hidden md:flex' : ''}`}>
              <Button
                size="sm"
                onClick={() => handleOpenAuth('login')}
                className="h-9 w-[100px] justify-center gap-1.5 rounded-[5px] bg-primary px-3 py-2 text-sm font-bold uppercase tracking-normal text-primary-foreground shadow-none transition-colors hover:bg-primary-hover"
              >
                <LogIn className="h-4 w-4" aria-hidden="true" />
                Entrar
              </Button>
            </div>
          )}

          {/* Mobile menu toggle */}
          <button
            onClick={() => {
              if (currentPath === '/') window.dispatchEvent(new Event('kurio:open-catalog-filters'))
              else setMobileMenuOpen(!mobileMenuOpen)
            }}
            className={`md:hidden p-2 rounded-lg border border-border text-foreground hover:bg-surface ${currentPath === '/' ? 'hidden' : ''}`}
            aria-label={currentPath === '/' ? 'Filtros' : 'Abrir menu'}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-surface px-4 py-4 space-y-3">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-semibold text-foreground"
          >
            Explorar Catálogo
          </Link>
          <Link
            to="/docs"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-semibold text-primary"
          >
            Documentação Técnica
          </Link>
          {!isAuthenticated ? (
            <div className="pt-2 flex flex-col gap-2">
              <Button
                variant="outline"
                onClick={() => handleOpenAuth('login')}
                className="w-full"
              >
                Entrar
              </Button>
              <Button
                onClick={() => handleOpenAuth('register')}
                className="w-full font-bold"
              >
                Cadastrar
              </Button>
            </div>
          ) : (
            <div className="pt-2 border-t border-border flex flex-col gap-2">
              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 text-xs text-foreground"
              >
                Meu Perfil
              </Link>
              <button
                onClick={handleLogout}
                className="py-1.5 text-xs text-red-400 text-left font-medium"
              >
                Sair da Conta
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  )
}
