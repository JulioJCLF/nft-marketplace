import React from 'react'
import { Link, useLocation } from '@tanstack/react-router'
import { Home, Heart, ShoppingCart, User, ScanLine } from 'lucide-react'
import { useCart } from '@/features/cart/CartContext'
import { useAuth } from '@/features/auth/AuthContext'

export const MobileBottomNav: React.FC = () => {
  const { itemCount, setIsCartDrawerOpen } = useCart()
  const { user, isAuthenticated, setAuthModalOpen, setAuthModalMode } = useAuth()
  const location = useLocation()
  const pathname = location.pathname
  const search = location.search as { tab?: string }

  // Do not show bottom nav in checkout flow (matching Figma mobile checkout frame)
  if (pathname.startsWith('/checkout') || pathname.startsWith('/nft/')) {
    return null
  }

  const handleOpenLogin = () => {
    setAuthModalMode('login')
    setAuthModalOpen(true)
  }

  const isHomeActive = pathname === '/'
  const isFavoritesActive = pathname.startsWith('/profile') && search?.tab === 'favorites'
  const isProfileActive = pathname.startsWith('/profile') && search?.tab !== 'favorites'

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 isolate flex h-24 items-center justify-around bg-transparent px-1 pb-safe md:hidden"
      aria-label="Navegação móvel inferior"
    >
      <svg
        className="pointer-events-none absolute inset-0 z-0 h-full w-full drop-shadow-[0_-6px_16px_rgba(0,0,0,0.22)]"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M0 30 C0 13 4 0 10 0 H33 C43 0 39 38 50 55 C61 38 58 0 67 0 H90 C96 0 100 13 100 30 V100 H0 Z"
          fill="#241612"
          stroke="#2F231B"
          strokeWidth="0.65"
        />
      </svg>
      {/* 1. Início */}
      <Link
        to="/"
        className={`relative z-10 flex h-12 w-14 items-center justify-center text-[10px] font-medium transition-colors ${
          isHomeActive ? 'text-primary font-bold' : 'text-foreground-muted hover:text-foreground'
        }`}
        aria-label="Início"
        aria-current={isHomeActive ? 'page' : undefined}
      >
        <Home className="h-6 w-6" aria-hidden="true" />
      </Link>

      {/* 2. Favoritos */}
      {isAuthenticated ? (
        <Link
          to="/profile"
          search={{ tab: 'favorites' }}
          className={`relative z-10 flex h-12 w-14 items-center justify-center text-[10px] font-medium transition-colors ${
            isFavoritesActive ? 'text-primary font-bold' : 'text-foreground-muted hover:text-foreground'
          }`}
          aria-label="Favoritos"
          aria-current={isFavoritesActive ? 'page' : undefined}
        >
          <Heart className={`h-6 w-6 ${isFavoritesActive ? 'fill-primary' : ''}`} aria-hidden="true" />
        </Link>
      ) : (
        <button
          type="button"
          onClick={handleOpenLogin}
          className="relative z-10 flex h-12 w-14 items-center justify-center text-foreground-muted transition-colors hover:text-foreground focus:outline-none"
          aria-label="Favoritos (entrar para ver)"
        >
          <Heart className="h-6 w-6" aria-hidden="true" />
        </button>
      )}

      {/* 3. Botão Central Elevado (Figma Frame 14:5226 / Nó 70395:245 - Puramente Visual / Estático) */}
      <div
        className="pointer-events-none relative z-10 -mt-20 flex h-16 w-16 -translate-y-2 items-center justify-center"
        aria-hidden="true"
      >
        <div className="absolute inset-0 rounded-full bg-primary/30 blur-xl" />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-full border-[5px] border-background bg-gradient-to-b from-primary/35 to-primary/90 text-[#F5E6D3] shadow-[0_0_24px_rgba(211,137,73,0.42)] backdrop-blur-sm">
          <ScanLine className="h-7 w-7" strokeWidth={1.7} />
        </div>
      </div>

      {/* 4. Carrinho */}
      <button
        type="button"
        onClick={() => setIsCartDrawerOpen(true)}
        className="relative z-10 flex h-12 w-14 items-center justify-center text-foreground-muted transition-colors hover:text-foreground focus:outline-none"
        aria-label={`Carrinho com ${itemCount} itens`}
      >
        <div className="relative">
          <ShoppingCart className="h-6 w-6" aria-hidden="true" />
          {itemCount > 0 && (
            <span className="absolute -top-1.5 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground shadow-sm">
              {itemCount}
            </span>
          )}
        </div>
      </button>

      {/* 5. Perfil / Login */}
      {isAuthenticated && user ? (
        <Link
          to="/profile"
          className={`relative z-10 flex h-12 w-14 items-center justify-center text-[10px] font-medium transition-colors ${
            isProfileActive ? 'text-primary font-bold' : 'text-foreground-muted hover:text-foreground'
          }`}
          aria-label="Meu Perfil"
          aria-current={isProfileActive ? 'page' : undefined}
        >
          <img
            src={user.avatar}
            alt={user.name}
            className="h-6 w-6 rounded-full border border-primary/50 object-cover"
          />
        </Link>
      ) : (
        <button
          type="button"
          onClick={handleOpenLogin}
          className="relative z-10 flex h-12 w-14 items-center justify-center text-foreground-muted transition-colors hover:text-foreground focus:outline-none"
          aria-label="Entrar na conta"
        >
          <User className="h-6 w-6" aria-hidden="true" />
        </button>
      )}
    </nav>
  )
}
