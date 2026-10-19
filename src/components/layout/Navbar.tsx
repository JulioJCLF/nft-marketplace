import React, { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { ShoppingBag, User, LogOut, Wallet, BookOpen, Menu, X, Heart, Package } from 'lucide-react'
import { useAuth } from '@/features/auth/AuthContext'
import { useCart } from '@/features/cart/CartContext'
import { Button } from '@/components/ui/Button'

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout, setAuthModalOpen, setAuthModalMode } = useAuth()
  const { itemCount, setIsCartDrawerOpen } = useCart()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)

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
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <Link to="/" className="flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg p-1">
          <div className="w-10 h-10 rounded-lg bg-surface border border-border flex items-center justify-center text-primary group-hover:border-primary transition-colors shadow-sm">
            <svg viewBox="0 0 32 32" className="w-6 h-6 fill-none">
              <path d="M16 4L26 11L16 18L6 11L16 4Z" fill="#D08848" />
              <path d="M6 13L16 20L26 13L26 17L16 26L6 17V13Z" fill="#E59A5A" />
              <circle cx="16" cy="14" r="2.5" fill="#0E0C0A" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-lg tracking-wider text-foreground leading-tight">
              NFT<span className="text-primary">VERSE</span>
            </span>
            <span className="text-[10px] text-foreground-muted tracking-widest font-mono uppercase">
              Marketplace
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          <Link
            to="/"
            className="text-foreground hover:text-primary transition-colors data-[status=active]:text-primary"
          >
            Explorar
          </Link>
          <Link
            to="/"
            search={{ category: 'collectibles' }}
            className="text-foreground-muted hover:text-foreground transition-colors"
          >
            Colecionáveis
          </Link>
          <Link
            to="/"
            search={{ category: 'art' }}
            className="text-foreground-muted hover:text-foreground transition-colors"
          >
            Arte Digital
          </Link>
          <Link
            to="/docs"
            className="flex items-center gap-1.5 text-foreground-muted hover:text-primary transition-colors"
          >
            <BookOpen className="w-4 h-4 text-primary" />
            <span>Documentação</span>
          </Link>
        </nav>

        {/* Right Action Icons & Auth */}
        <div className="flex items-center gap-3">
          {/* Cart Trigger */}
          <button
            onClick={() => setIsCartDrawerOpen(true)}
            className="relative p-2.5 rounded-lg border border-border bg-surface hover:bg-surface-secondary text-foreground hover:border-primary/60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label={`Abrir carrinho com ${itemCount} itens`}
          >
            <ShoppingBag className="w-5 h-5" />
            {itemCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground shadow-md animate-in zoom-in-50">
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
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenAuth('login')}
                className="h-8 px-2.5 text-xs sm:h-9 sm:px-3"
              >
                Entrar
              </Button>
              <Button
                size="sm"
                onClick={() => handleOpenAuth('login')}
                className="hidden sm:inline-flex font-bold"
              >
                Conectar Carteira
              </Button>
            </div>
          )}

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg border border-border text-foreground hover:bg-surface"
            aria-label="Abrir menu"
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
