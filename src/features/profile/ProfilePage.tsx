import React, { useState, useEffect } from 'react'
import { useAuth } from '@/features/auth/AuthContext'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Wallet, OrderReceipt, NFT, WalletProvider, NetworkId } from '@/types'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { NFTCard } from '@/features/catalog/NFTCard'
import { formatEth, formatDate, truncateAddress } from '@/lib/eth'
import { useNavigate, useSearch } from '@tanstack/react-router'
import {
  User as UserIcon,
  Wallet as WalletIcon,
  Package,
  Heart,
  KeyRound,
  Plus,
  Trash2,
  Star,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Download,
  LogOut,
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/Dialog'

export const ProfilePage: React.FC = () => {
  const { user, isAuthenticated, isLoading, setAuthModalOpen, setRedirectAfterAuth, refreshSession, logout } = useAuth()
  const navigate = useNavigate()
  const search = useSearch({ strict: false }) as { tab?: string }
  const queryClient = useQueryClient()

  const activeTab = search.tab || 'profile'

  const setActiveTab = (tab: string) => {
    navigate({ to: '/profile', search: { tab } })
  }

  // Selected receipt for detailed modal view
  const [selectedReceipt, setSelectedReceipt] = useState<OrderReceipt | null>(null)

  // Profile Form States
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [avatar, setAvatar] = useState('')
  const [profileMessage, setProfileMessage] = useState<string | null>(null)
  const [profileError, setProfileError] = useState<string | null>(null)

  // Password Form States
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  // Add Wallet Modal States
  const [addWalletOpen, setAddWalletOpen] = useState(false)
  const [newWalletAddress, setNewWalletAddress] = useState('')
  const [newWalletProvider, setNewWalletProvider] = useState<WalletProvider>('metamask')
  const [newWalletNetwork, setNewWalletNetwork] = useState<NetworkId>('mainnet')
  const [walletError, setWalletError] = useState<string | null>(null)

  useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated) {
      setRedirectAfterAuth('/profile')
      setAuthModalOpen(true)
    } else if (user) {
      setName(user.name)
      setEmail(user.email)
      setAvatar(user.avatar)
    }
  }, [isLoading, isAuthenticated, user, setAuthModalOpen, setRedirectAfterAuth])

  // Queries for Wallets, Orders, and Favorites
  const { data: walletsData } = useQuery<{ items: Wallet[] }>({
    queryKey: ['wallets', user?.id],
    queryFn: async () => {
      const res = await api.get<{ items: Wallet[] }>('/wallets')
      return res.data
    },
    enabled: !!user,
  })

  const { data: ordersData } = useQuery<{ items: OrderReceipt[] }>({
    queryKey: ['orders', user?.id],
    queryFn: async () => {
      const res = await api.get<{ items: OrderReceipt[] }>('/orders')
      return res.data
    },
    enabled: !!user,
  })

  const { data: favoritesData } = useQuery<{ items: NFT[] }>({
    queryKey: ['favorites', user?.id],
    queryFn: async () => {
      const res = await api.get<{ items: NFT[] }>('/favorites')
      return res.data
    },
    enabled: !!user,
  })

  // Mutations
  const updateProfileMutation = useMutation({
    mutationFn: async (data: { name: string; email: string; avatar: string }) => {
      const res = await api.put('/profile', data)
      return res.data
    },
    onSuccess: () => {
      setProfileMessage('Perfil atualizado com sucesso!')
      refreshSession()
      setTimeout(() => setProfileMessage(null), 3000)
    },
    onError: (err: unknown) => {
      setProfileError((err as Error).message || 'Falha ao atualizar perfil')
    },
  })

  const updatePasswordMutation = useMutation({
    mutationFn: async () => {
      if (newPassword !== confirmPassword) {
        throw new Error('A nova senha e a confirmação não coincidem.')
      }
      const res = await api.put('/profile/password', { currentPassword, newPassword })
      return res.data
    },
    onSuccess: () => {
      setPasswordMessage('Senha alterada com sucesso!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setPasswordMessage(null), 3000)
    },
    onError: (err: unknown) => {
      setPasswordError((err as Error).message || 'Falha ao alterar senha')
    },
  })

  const setPrimaryWalletMutation = useMutation({
    mutationFn: async (walletId: string) => {
      await api.put(`/wallets/${walletId}/primary`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallets', user?.id] })
    },
  })

  const removeWalletMutation = useMutation({
    mutationFn: async (walletId: string) => {
      await api.delete(`/wallets/${walletId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallets', user?.id] })
    },
  })

  const addWalletMutation = useMutation({
    mutationFn: async () => {
      if (!newWalletAddress.trim().startsWith('0x')) {
        throw new Error('Endereço Ethereum inválido. Deve iniciar com 0x.')
      }
      const res = await api.post('/wallets', {
        address: newWalletAddress.trim(),
        provider: newWalletProvider,
        network: newWalletNetwork,
        isPrimary: false,
      })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallets', user?.id] })
      setAddWalletOpen(false)
      setNewWalletAddress('')
      setWalletError(null)
    },
    onError: (err: unknown) => {
      setWalletError((err as Error).message || 'Falha ao cadastrar carteira')
    },
  })

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center">
          <UserIcon className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Autenticação Necessária</h2>
        <p className="text-xs text-foreground-muted">Faça login para gerenciar seu perfil e suas carteiras.</p>
        <Button onClick={() => setAuthModalOpen(true)} className="font-bold">
          Conectar Conta
        </Button>
      </div>
    )
  }

  const wallets = walletsData?.items || []
  const orders = ordersData?.items || []
  const favorites = favoritesData?.items || []

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Mobile Horizontal Tabs (< lg) */}
      <div className="lg:hidden flex border-b border-border overflow-x-auto pb-2 gap-2">
        {[
          { id: 'profile', label: 'Dados do Perfil', icon: UserIcon },
          { id: 'wallets', label: `Carteiras (${wallets.length})`, icon: WalletIcon },
          { id: 'orders', label: `Meus Pedidos (${orders.length})`, icon: Package },
          { id: 'favorites', label: `Favoritos (${favorites.length})`, icon: Heart },
        ].map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-2 px-3.5 text-xs font-bold rounded-lg whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-primary text-black font-extrabold shadow-sm'
                  : 'bg-surface border border-border text-foreground-muted hover:text-foreground'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Main 2-Column Layout for Desktop (Figma Frames 8 & 9) */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Left Sidebar (Desktop) */}
        <aside className="w-full lg:w-72 shrink-0 space-y-6 hidden lg:block">
          {/* User Card */}
          <div className="p-6 rounded-2xl border border-border bg-surface text-center space-y-4 shadow-sm">
            <div className="relative inline-block">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-24 h-24 rounded-full mx-auto bg-surface-secondary border-2 border-primary/60 object-cover shadow-lg"
              />
              <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-surface" title="Online" />
            </div>

            <div>
              <h2 className="text-lg font-extrabold text-foreground">{user.name}</h2>
              <p className="text-xs text-foreground-muted truncate">{user.email}</p>
              <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/30 text-primary text-[11px] font-bold">
                <CheckCircle2 className="w-3 h-3" />
                <span>Colecionador Verificado</span>
              </div>
            </div>

            {/* Account Quick Stats */}
            <div className="pt-4 border-t border-border grid grid-cols-2 gap-2 text-center text-xs">
              <div className="p-2 rounded-lg bg-surface-secondary/50">
                <span className="text-[10px] text-foreground-muted block">Pedidos</span>
                <span className="font-mono font-bold text-foreground">{orders.length}</span>
              </div>
              <div className="p-2 rounded-lg bg-surface-secondary/50">
                <span className="text-[10px] text-foreground-muted block">Favoritos</span>
                <span className="font-mono font-bold text-primary">{favorites.length}</span>
              </div>
            </div>
          </div>

          {/* Vertical Navigation Menu */}
          <nav className="p-3 rounded-2xl border border-border bg-surface shadow-sm space-y-1">
            {[
              { id: 'profile', label: 'Dados do Perfil', icon: UserIcon },
              { id: 'wallets', label: 'Carteiras Web3', count: wallets.length, icon: WalletIcon },
              { id: 'orders', label: 'Histórico de Pedidos', count: orders.length, icon: Package },
              { id: 'favorites', label: 'Favoritos Salvos', count: favorites.length, icon: Heart },
            ].map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-primary text-black shadow'
                      : 'text-foreground-muted hover:text-foreground hover:bg-surface-secondary'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.count !== undefined && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                        isActive
                          ? 'bg-black/20 text-black font-extrabold'
                          : 'bg-surface-secondary border border-border text-foreground-muted'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              )
            })}

            <div className="pt-2 mt-2 border-t border-border">
              <button
                onClick={() => {
                  logout()
                  navigate({ to: '/' })
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Encerrar Sessão</span>
              </button>
            </div>
          </nav>
        </aside>

        {/* Right Main Content Area */}
        <div className="flex-1 min-w-0 w-full space-y-6">

      {/* Tab: Profile Data & Password */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Personal Info Form */}
          <div className="p-6 rounded-2xl border border-border bg-surface shadow-sm space-y-4">
            <h2 className="text-base font-bold text-foreground">Informações Pessoais</h2>

            {profileMessage && (
              <div className="p-3 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{profileMessage}</span>
              </div>
            )}
            {profileError && (
              <div className="p-3 rounded-md bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>{profileError}</span>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault()
                setProfileMessage(null)
                setProfileError(null)
                updateProfileMutation.mutate({ name, email, avatar })
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block font-medium text-foreground-muted mb-1.5">Avatar / Foto de Perfil</label>
                <div className="flex items-center gap-3">
                  {['/avatars/alice.svg', '/avatars/bob.svg', '/avatars/yuga.svg', '/avatars/creator.svg'].map(
                    (av, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setAvatar(av)}
                        className={`w-10 h-10 rounded-full overflow-hidden border-2 transition-all ${
                          avatar === av ? 'border-primary ring-2 ring-primary/40' : 'border-border opacity-60'
                        }`}
                      >
                        <img src={av} alt="Opção de avatar" className="w-full h-full object-cover" />
                      </button>
                    )
                  )}
                </div>
              </div>

              <div>
                <label className="block font-medium text-foreground-muted mb-1.5">Nome Completo</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required />
              </div>

              <div>
                <label className="block font-medium text-foreground-muted mb-1.5">E-mail Cadastrado</label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>

              <Button type="submit" isLoading={updateProfileMutation.isPending} className="font-bold">
                Salvar Alterações
              </Button>
            </form>
          </div>

          {/* Change Password Form */}
          <div className="p-6 rounded-2xl border border-border bg-surface shadow-sm space-y-4">
            <div className="flex items-center gap-2 font-bold text-foreground text-base">
              <KeyRound className="w-4 h-4 text-primary" />
              <h2>Segurança & Senha</h2>
            </div>

            {passwordMessage && (
              <div className="p-3 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{passwordMessage}</span>
              </div>
            )}
            {passwordError && (
              <div className="p-3 rounded-md bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>{passwordError}</span>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault()
                setPasswordMessage(null)
                setPasswordError(null)
                updatePasswordMutation.mutate()
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block font-medium text-foreground-muted mb-1.5">Senha Atual</label>
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-foreground-muted mb-1.5">Nova Senha</label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-foreground-muted mb-1.5">Confirmar Nova Senha</label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a nova senha"
                  required
                />
              </div>

              <Button type="submit" variant="secondary" isLoading={updatePasswordMutation.isPending} className="font-bold">
                Alterar Senha
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Tab: Connected Wallets */}
      {activeTab === 'wallets' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-foreground">Carteiras Web3 Registradas</h2>
              <p className="text-xs text-foreground-muted">Gerencie suas chaves públicas e defina a carteira preferencial.</p>
            </div>
            <Button onClick={() => setAddWalletOpen(true)} size="sm" className="gap-1.5 font-bold">
              <Plus className="w-4 h-4" />
              <span>Adicionar Carteira</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {wallets.map((w) => (
              <div
                key={w.id}
                data-testid="wallet-card"
                className={`p-5 rounded-2xl border transition-all ${
                  w.isPrimary
                    ? 'border-primary bg-primary/5 shadow-md ring-1 ring-primary/40'
                    : 'border-border bg-surface'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <strong className="text-sm font-bold text-foreground capitalize">{w.provider}</strong>
                      {w.isPrimary && (
                        <Badge variant="default" className="text-[10px] font-bold gap-1 py-0">
                          <Star className="w-3 h-3 fill-primary" />
                          Principal
                        </Badge>
                      )}
                    </div>
                    <span className="font-mono text-xs text-foreground-muted block">{w.address}</span>
                  </div>

                  {!w.isPrimary && (
                    <button
                      onClick={() => removeWalletMutation.mutate(w.id)}
                      className="text-foreground-muted hover:text-red-400 p-1"
                      aria-label="Remover carteira"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-foreground-muted block text-[10px]">Saldo Estimado:</span>
                    <span className="font-mono font-bold text-primary">{formatEth(w.balanceEth)}</span>
                  </div>

                  {!w.isPrimary && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPrimaryWalletMutation.mutate(w.id)}
                      className="text-xs h-7 px-2"
                    >
                      Definir como Principal
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Add Wallet Modal */}
          <Dialog open={addWalletOpen} onOpenChange={setAddWalletOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Adicionar Nova Carteira</DialogTitle>
                <DialogDescription>Conecte um novo endereço público Ethereum para liquidação de NFTs.</DialogDescription>
              </DialogHeader>

              {walletError && (
                <div className="p-3 rounded-md bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>{walletError}</span>
                </div>
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  addWalletMutation.mutate()
                }}
                className="space-y-4 text-xs"
              >
                <div>
                  <label className="block font-medium text-foreground-muted mb-1.5">Provedor</label>
                  <select
                    value={newWalletProvider}
                    onChange={(e) => setNewWalletProvider(e.target.value as WalletProvider)}
                    className="w-full h-10 rounded-md border border-border bg-surface px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="metamask">MetaMask</option>
                    <option value="coinbase">Coinbase Wallet</option>
                    <option value="rainbow">Rainbow</option>
                    <option value="walletconnect">WalletConnect</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-foreground-muted mb-1.5">Rede Padrão</label>
                  <select
                    value={newWalletNetwork}
                    onChange={(e) => setNewWalletNetwork(e.target.value as NetworkId)}
                    className="w-full h-10 rounded-md border border-border bg-surface px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="mainnet">Ethereum Mainnet</option>
                    <option value="sepolia">Sepolia Testnet</option>
                    <option value="arbitrum">Arbitrum One</option>
                    <option value="polygon">Polygon</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-foreground-muted mb-1.5">Endereço Público (0x...)</label>
                  <Input
                    placeholder="0x..."
                    value={newWalletAddress}
                    onChange={(e) => setNewWalletAddress(e.target.value)}
                    required
                    className="font-mono text-xs"
                  />
                </div>

                <Button type="submit" isLoading={addWalletMutation.isPending} className="w-full font-bold">
                  Cadastrar Carteira
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* Tab: Orders History */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <h2 className="text-base font-bold text-foreground">Histórico de Pedidos</h2>

          {orders.length === 0 ? (
            <div className="p-12 text-center border border-border rounded-xl bg-surface/50 text-foreground-muted space-y-2">
              <Package className="w-10 h-10 mx-auto opacity-40" />
              <p className="font-semibold text-foreground text-sm">Nenhum pedido realizado ainda.</p>
              <p className="text-xs">Seus recibos e compras confirmadas aparecerão nesta área com snapshot imutável.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.orderId} className="p-5 rounded-xl border border-border bg-surface space-y-3 text-xs">
                  <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-border/60">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-foreground">{order.orderId}</span>
                      <span className="text-foreground-muted">{formatDate(order.createdAt)}</span>
                    </div>
                    <Badge variant={order.status === 'confirmed' ? 'success' : 'danger'}>
                      {order.status === 'confirmed' ? 'Confirmado' : 'Falhou'}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-2">
                      {order.items.slice(0, 3).map((it, i) => (
                        <img
                          key={i}
                          src={it.image}
                          alt={it.name}
                          className="w-10 h-10 rounded object-cover border border-border bg-surface-secondary"
                        />
                      ))}
                      {order.items.length > 3 && (
                        <span className="text-xs text-foreground-muted">+{order.items.length - 3}</span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-foreground-muted uppercase block">Total</span>
                      <span className="font-mono font-bold text-base text-primary">{formatEth(order.total)}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border/40 flex justify-between items-center text-[11px] text-foreground-muted font-mono">
                    <span>TX: {truncateAddress(order.txHash, 10, 8)}</span>
                    <button
                      onClick={() => setSelectedReceipt(order)}
                      className="text-primary hover:text-primary-hover flex items-center gap-1 font-sans font-semibold transition-colors"
                    >
                      <span>Ver Recibo</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Order Receipt Detail Dialog */}
          <Dialog open={!!selectedReceipt} onOpenChange={(open) => !open && setSelectedReceipt(null)}>
            <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
              {selectedReceipt && (
                <div className="space-y-5 text-xs">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <span>Recibo Oficial do Pedido</span>
                    </DialogTitle>
                    <DialogDescription>
                      Snapshot imutável do pedido registrado na blockchain Ethereum.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="p-4 rounded-xl border border-border bg-surface-secondary/40 space-y-3 font-mono text-[11px]">
                    <div className="flex justify-between pb-2 border-b border-border/40">
                      <span className="text-foreground-muted">ID do Pedido:</span>
                      <span className="font-bold text-foreground">{selectedReceipt.orderId}</span>
                    </div>
                    <div className="flex justify-between pb-2 border-b border-border/40">
                      <span className="text-foreground-muted">Data/Hora:</span>
                      <span className="text-foreground">{formatDate(selectedReceipt.createdAt)}</span>
                    </div>
                    <div className="flex justify-between pb-2 border-b border-border/40">
                      <span className="text-foreground-muted">Carteira:</span>
                      <span className="text-foreground">{selectedReceipt.walletAddress}</span>
                    </div>
                    <div className="flex justify-between pb-2 border-b border-border/40">
                      <span className="text-foreground-muted">Rede:</span>
                      <span className="text-primary uppercase font-bold">{selectedReceipt.network}</span>
                    </div>
                    <div className="flex flex-col gap-1 pb-2 border-b border-border/40">
                      <span className="text-foreground-muted">Hash da Transação:</span>
                      <span className="text-primary break-all">{selectedReceipt.txHash}</span>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="space-y-2">
                    <span className="font-bold text-foreground uppercase tracking-wider text-[11px] block">
                      Itens do Pedido ({selectedReceipt.items.length})
                    </span>
                    {selectedReceipt.items.map((it, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-surface border border-border">
                        <div className="flex items-center gap-3">
                          <img src={it.image} alt={it.name} className="w-10 h-10 rounded object-cover" />
                          <div>
                            <strong className="text-foreground text-xs block">{it.name}</strong>
                            <span className="text-[11px] text-foreground-muted">Qtd: {it.quantity}</span>
                          </div>
                        </div>
                        <div className="font-mono font-bold text-primary">{formatEth(it.lineTotal)}</div>
                      </div>
                    ))}
                  </div>

                  {/* Totals */}
                  <div className="pt-3 border-t border-border space-y-1.5 font-mono text-xs">
                    <div className="flex justify-between text-foreground-muted">
                      <span>Subtotal</span>
                      <span>{formatEth(selectedReceipt.subtotal)}</span>
                    </div>
                    {selectedReceipt.discount !== '0.0000' && (
                      <div className="flex justify-between text-emerald-400">
                        <span>Desconto</span>
                        <span>- {formatEth(selectedReceipt.discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-foreground-muted">
                      <span>Taxa de Gás</span>
                      <span>{formatEth(selectedReceipt.gasFee)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-foreground pt-1.5 border-t border-border">
                      <span>Total Pago</span>
                      <span className="text-primary">{formatEth(selectedReceipt.total)}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" onClick={() => window.print()} className="flex-1 gap-1.5 text-xs">
                      <Download className="w-4 h-4" />
                      <span>Imprimir / Salvar PDF</span>
                    </Button>
                    <Button onClick={() => setSelectedReceipt(null)} className="flex-1 text-xs font-bold">
                      Fechar
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* Tab: Favorites */}
      {activeTab === 'favorites' && (
        <div className="space-y-6">
          <h2 className="text-base font-bold text-foreground">Obras Favoritadas</h2>
          {favorites.length === 0 ? (
            <div className="p-12 text-center border border-border rounded-xl bg-surface/50 text-foreground-muted space-y-2">
              <Heart className="w-10 h-10 mx-auto opacity-40 text-red-400" />
              <p className="font-semibold text-foreground text-sm">Você ainda não favoritou nenhuma obra.</p>
              <p className="text-xs">Clique no ícone de coração nos cards do catálogo para salvar obras em sua lista pessoal.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {favorites.map((nft) => (
                <NFTCard key={nft.id} nft={nft} />
              ))}
            </div>
          )}
        </div>
      )}
        </div>
      </div>
    </div>
  )
}
