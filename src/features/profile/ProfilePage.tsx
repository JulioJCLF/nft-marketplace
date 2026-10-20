import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/features/auth/AuthContext'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Wallet, OrderReceipt, NFT, WalletProvider, NetworkId } from '@/types'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { NFTCard } from '@/features/catalog/NFTCard'
import { formatEth, formatDate, truncateAddress } from '@/lib/eth'
import { useNavigate, useSearch } from '@tanstack/react-router'
import {
  User as UserIcon,
  Wallet as WalletIcon,
  Package,
  Heart,
  Trash2,
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
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [avatar, setAvatar] = useState('')
  const [profileWalletAlias, setProfileWalletAlias] = useState('')
  const [profileEnsName, setProfileEnsName] = useState('')
  const [profileEnsSuffix, setProfileEnsSuffix] = useState('eth')
  const avatarInputRef = useRef<HTMLInputElement>(null)
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
  const [networkError, setNetworkError] = useState<string | null>(null)
  const [walletAlias, setWalletAlias] = useState('')
  const [walletProfileName, setWalletProfileName] = useState('')
  const [ensOrSecondary, setEnsOrSecondary] = useState('')
  const [referralCode, setReferralCode] = useState('')
  const [ensName, setEnsName] = useState('')
  const [ensSuffix, setEnsSuffix] = useState('eth')
  const [walletProfileMessage, setWalletProfileMessage] = useState<string | null>(null)
  const [walletProfileError, setWalletProfileError] = useState<string | null>(null)

  useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated) {
      setRedirectAfterAuth('/profile')
      setAuthModalOpen(true)
    } else if (user) {
      setName(user.name)
      setUsername(user.username ?? '')
      setEmail(user.email)
      setAvatar(user.avatar)
      setProfileWalletAlias(user.walletAlias ?? '')
      setProfileEnsName(user.ensName ?? '')
      setProfileEnsSuffix(user.ensSuffix ?? 'eth')
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

  useEffect(() => {
    const primaryWallet = walletsData?.items.find((wallet) => wallet.isPrimary)
    if (!primaryWallet) return
    setWalletAlias(primaryWallet.walletAlias ?? '')
    setWalletProfileName(primaryWallet.profileName ?? '')
    setEnsOrSecondary(primaryWallet.ensOrSecondary ?? '')
    setReferralCode(primaryWallet.referralCode ?? '')
    setEnsName(primaryWallet.ensName ?? '')
    setEnsSuffix(primaryWallet.ensSuffix ?? 'eth')
  }, [walletsData?.items])

  // Mutations
  const updateProfileMutation = useMutation({
    mutationFn: async (data: { name: string; username: string; email: string; avatar: string; walletAlias: string; ensName: string; ensSuffix: string }) => {
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

  const updateWalletNetworkMutation = useMutation({
    mutationFn: async ({ walletId, network }: { walletId: string; network: NetworkId }) => {
      await api.put(`/wallets/${walletId}/network`, { network })
    },
    onMutate: async ({ walletId, network }) => {
      const queryKey = ['wallets', user?.id]
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<{ items: Wallet[] }>(queryKey)
      queryClient.setQueryData<{ items: Wallet[] } | undefined>(queryKey, (current) =>
        current ? { ...current, items: current.items.map((wallet) => wallet.id === walletId ? { ...wallet, network } : wallet) } : current
      )
      setNetworkError(null)
      return { previous, queryKey }
    },
    onError: (err: unknown, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(context.queryKey, context.previous)
      setNetworkError((err as Error).message || 'Falha ao atualizar a rede da carteira')
    },
    onSuccess: (_data, _variables, context) => {
      if (context) queryClient.invalidateQueries({ queryKey: context.queryKey })
    },
  })

  const updateWalletProfileMutation = useMutation({
    mutationFn: async ({ walletId, fields }: { walletId: string; fields: Pick<Wallet, 'walletAlias' | 'profileName' | 'ensOrSecondary' | 'referralCode' | 'ensName' | 'ensSuffix'> }) => {
      await api.put(`/wallets/${walletId}/profile`, fields)
    },
    onSuccess: () => {
      setWalletProfileMessage('Dados da carteira salvos.')
      setWalletProfileError(null)
      queryClient.invalidateQueries({ queryKey: ['wallets', user?.id] })
    },
    onError: (err: unknown) => {
      setWalletProfileError((err as Error).message || 'Falha ao salvar os dados da carteira')
      setWalletProfileMessage(null)
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
        isPrimary: !wallets.some((wallet) => wallet.isPrimary),
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
    <div className="mx-auto max-w-[1200px] px-4 py-8 md:px-0 md:pt-7">
      {/* Mobile Horizontal Tabs (< lg) */}
      <div className="mb-6 flex gap-5 overflow-x-auto border-b border-border pb-2 lg:hidden">
        {[
          { id: 'profile', label: 'Dados do Perfil', icon: UserIcon },
          { id: 'wallets', label: 'Carteiras', icon: WalletIcon },
          { id: 'orders', label: 'Atividade', icon: Package },
          { id: 'favorites', label: 'Lista de interesse', icon: Heart },
        ].map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-1 py-2 text-xs font-semibold transition-colors ${
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-foreground-muted hover:text-foreground'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Main 2-Column Layout for Desktop (Figma Frames 8 & 9) */}
      <div className="flex flex-col items-start gap-7 lg:flex-row lg:gap-7">
        {/* Left Sidebar (Desktop) */}
        <aside className="hidden w-full shrink-0 lg:block lg:w-[310px]">
          <nav className="min-h-[407px] bg-surface px-0 pb-3 pt-3">
            <h2 className="px-2.5 pb-2 text-base font-bold text-foreground">Meu perfil</h2>
            {[
              { id: 'profile', label: 'Dados do Perfil', icon: UserIcon },
              { id: 'wallets', label: 'Carteiras', icon: WalletIcon },
              { id: 'orders', label: 'Atividade', icon: Package },
              { id: 'favorites', label: 'Lista de interesse', icon: Heart },
            ].map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative flex w-full items-center justify-between px-3 py-3 text-xs font-medium transition-colors ${
                    isActive
                      ? 'text-primary before:absolute before:inset-y-0 before:left-0 before:w-[5px] before:bg-primary'
                      : 'text-foreground-muted hover:text-primary'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                </button>
              )
            })}

            <div className="mt-1 border-t border-border pt-1">
              <button
                onClick={() => {
                  logout()
                  navigate({ to: '/' })
                }}
                className="flex w-full items-center gap-2.5 px-3 py-3 text-xs font-semibold text-primary transition-colors hover:bg-surface-secondary"
              >
                <LogOut className="w-4 h-4" />
                <span>Sair</span>
              </button>
            </div>
          </nav>
        </aside>

        {/* Right Main Content Area */}
        <div className="min-w-0 w-full flex-1 space-y-6">

      {/* Tab: Profile Data & Password */}
      {activeTab === 'profile' && (
        <div className="space-y-7">
          <h1 className="text-base font-bold text-foreground">Perfil do colecionador</h1>
          {/* Personal Info Form */}
          <div className="space-y-4">

            {profileMessage && (
              <Alert role="status" variant="success" className="gap-2 rounded-md p-3">
                <CheckCircle2 className="w-4 h-4" />
                <AlertDescription>{profileMessage}</AlertDescription>
              </Alert>
            )}
            {profileError && (
              <Alert variant="destructive" className="gap-2 rounded-md p-3">
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>{profileError}</AlertDescription>
              </Alert>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault()
                setProfileMessage(null)
                setProfileError(null)
                updateProfileMutation.mutate({ name, username, email, avatar, walletAlias: profileWalletAlias, ensName: profileEnsName, ensSuffix: profileEnsSuffix })
              }}
              className="space-y-6 text-xs"
            >
              <div className="grid grid-cols-1 items-start gap-x-6 gap-y-6 md:grid-cols-2">
                <div className="space-y-6">
                  <div>
                    <label htmlFor="profile-display-name" className="mb-2 block text-xs text-foreground">Nome de exibição<span className="text-primary">*</span></label>
                    <Input id="profile-display-name" value={name} onChange={(e) => setName(e.target.value)} required className="h-10 rounded-sm border-border bg-transparent px-3 text-xs" />
                  </div>
                  <div>
                    <label htmlFor="profile-email" className="mb-2 block text-xs text-foreground">E-mail<span className="text-primary">*</span></label>
                    <Input id="profile-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-10 rounded-sm border-border bg-transparent px-3 text-xs" />
                  </div>
                  <div>
                    <label htmlFor="profile-wallet-alias" className="mb-2 block text-xs text-foreground">Apelido da carteira<span className="text-primary">*</span></label>
                    <Input id="profile-wallet-alias" value={profileWalletAlias} onChange={(e) => setProfileWalletAlias(e.target.value)} className="h-10 rounded-sm border-border bg-transparent px-3 text-xs" />
                  </div>
                  {passwordMessage && <p className="text-xs text-emerald-400" role="status">{passwordMessage}</p>}
                  {passwordError && <p className="text-xs text-red-400" role="alert">{passwordError}</p>}
                  <div>
                    <label className="mb-2 block text-xs text-foreground">Senha atual</label>
                    <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="••••••••" className="h-10 rounded-sm border-border bg-transparent px-3 text-xs" />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs text-foreground">Nova senha</label>
                    <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" className="h-10 rounded-sm border-border bg-transparent px-3 text-xs" />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs text-foreground">Confirmar nova senha</label>
                    <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" className="h-10 rounded-sm border-border bg-transparent px-3 text-xs" />
                  </div>
                  <Button
                    type="button"
                    onClick={() => {
                      setPasswordError(null)
                      setPasswordMessage(null)
                      if (!currentPassword || !newPassword || !confirmPassword) {
                        setPasswordError('Preencha os três campos de senha.')
                        return
                      }
                      updatePasswordMutation.mutate()
                    }}
                    isLoading={updatePasswordMutation.isPending}
                    className="h-10 min-w-[131px] rounded-sm px-5 text-xs font-bold"
                  >
                    Salvar senha
                  </Button>
                </div>
                <div className="space-y-6">
                  <div>
                    <label htmlFor="profile-username" className="mb-2 block text-xs text-foreground">Nome de usuário<span className="text-primary">*</span></label>
                    <Input id="profile-username" value={username} onChange={(e) => setUsername(e.target.value)} className="h-10 rounded-sm border-border bg-transparent px-3 text-xs" />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs text-foreground">Nome ENS<span className="text-primary">*</span></label>
                    <div className="flex h-10 min-w-0 gap-2.5">
                      <select value={profileEnsSuffix} onChange={(e) => setProfileEnsSuffix(e.target.value)} aria-label="Sufixo ENS do perfil" className="h-10 w-[78px] shrink-0 border border-border bg-background px-2 text-xs text-foreground outline-none focus:border-primary">
                        <option value="eth">.eth</option>
                      </select>
                      <Input aria-label="Nome ENS do perfil" value={profileEnsName} onChange={(e) => setProfileEnsName(e.target.value)} className="h-10 min-w-0 flex-1 rounded-none border-border bg-transparent px-3 text-xs" />
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-xs text-foreground">Avatar</label>
                    <div className="flex items-center gap-4">
                      <img src={avatar || '/avatars/creator.svg'} alt={`Avatar de ${name}`} className="h-12 w-12 rounded-full border border-primary/60 object-cover" />
                      <div className="flex items-center gap-3 text-xs">
                        <Button type="button" size="sm" onClick={() => avatarInputRef.current?.click()} className="h-auto rounded-sm bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-none hover:bg-primary-hover">Alterar</Button>
                        <Button type="button" variant="link" size="sm" onClick={() => setAvatar('/avatars/creator.svg')} className="h-auto p-0 text-xs text-foreground-muted hover:text-foreground hover:no-underline">Remover</Button>
                      </div>
                      <input
                        ref={avatarInputRef}
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        aria-label="Enviar arquivo de avatar"
                        onChange={(event) => {
                          const file = event.target.files?.[0]
                          event.target.value = ''
                          if (!file) return
                          if (!file.type.startsWith('image/')) {
                            setProfileError('Selecione um arquivo de imagem.')
                            return
                          }
                          if (file.size > 1024 * 1024) {
                            setProfileError('A imagem do avatar deve ter no máximo 1 MB.')
                            return
                          }
                          const reader = new FileReader()
                          reader.onload = () => {
                            if (typeof reader.result === 'string') {
                              setProfileError(null)
                              setAvatar(reader.result)
                            }
                          }
                          reader.onerror = () => setProfileError('Não foi possível ler a imagem selecionada.')
                          reader.readAsDataURL(file)
                        }}
                      />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2" aria-label="Avatares predefinidos">
                      {['/avatars/alice.svg', '/avatars/bob.svg', '/avatars/yuga.svg', '/avatars/creator.svg'].map((av) => (
                        <button key={av} type="button" onClick={() => setAvatar(av)} aria-label="Selecionar avatar predefinido" className={`h-8 w-8 overflow-hidden rounded-full border ${avatar === av ? 'border-primary' : 'border-border opacity-60'}`}>
                          <img src={av} alt="" className="h-full w-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <Button type="submit" isLoading={updateProfileMutation.isPending} className="h-10 min-w-[131px] rounded-sm px-5 text-xs font-bold">
                Salvar
              </Button>
            </form>
          </div>

        </div>
      )}

      {/* Tab: Connected Wallets */}
      {activeTab === 'wallets' && (
        <div className="space-y-7">
          <section className="space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-base font-bold text-foreground">Carteira principal</h1>
                <p className="mt-1 text-xs text-foreground-muted">Estas carteiras ficam disponíveis no pagamento e para receber NFTs comprados.</p>
              </div>
              <Button type="button" variant="link" size="sm" aria-label="Adicionar carteira" onClick={() => setAddWalletOpen(true)} className="h-auto shrink-0 p-0 text-sm font-semibold text-primary hover:text-primary-hover hover:no-underline">Adicionar</Button>
            </div>

            {networkError && <p className="text-xs text-red-400" role="alert">{networkError}</p>}
            {walletProfileMessage && <p className="text-xs text-emerald-400" role="status">{walletProfileMessage}</p>}
            {walletProfileError && <p className="text-xs text-red-400" role="alert">{walletProfileError}</p>}

            {wallets.find((wallet) => wallet.isPrimary) ? (
              <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
                {(() => {
                  const primaryWallet = wallets.find((wallet) => wallet.isPrimary)!
                  const providerName: Record<WalletProvider, string> = {
                    metamask: 'MetaMask',
                    coinbase: 'Coinbase Wallet',
                    rainbow: 'Rainbow',
                    walletconnect: 'WalletConnect',
                  }
                  const fieldClassName = 'h-10 rounded-sm border-border bg-transparent px-3 text-xs text-foreground'
                  return (
                    <>
                      <label className="space-y-1.5 text-xs text-foreground">
                        <span className="block">Nome de exibição<span className="text-primary">*</span></span>
                        <Input value={user.name} readOnly className={fieldClassName} />
                      </label>
                      <label className="space-y-1.5 text-xs text-foreground">
                        <span className="block">Apelido da carteira<span className="text-primary">*</span></span>
                        <Input value={walletAlias} onChange={(event) => setWalletAlias(event.target.value)} placeholder={providerName[primaryWallet.provider]} className={fieldClassName} />
                      </label>
                      <label className="space-y-1.5 text-xs text-foreground">
                        <span className="block">Rede<span className="text-primary">*</span></span>
                        <select
                          aria-label="Rede da carteira principal"
                          value={primaryWallet.network}
                          onChange={(event) => updateWalletNetworkMutation.mutate({ walletId: primaryWallet.id, network: event.target.value as NetworkId })}
                          disabled={updateWalletNetworkMutation.isPending}
                          className="h-10 w-full border border-border bg-background px-3 text-xs text-foreground outline-none focus:border-primary disabled:opacity-60"
                        >
                          <option value="mainnet">Ethereum Mainnet</option>
                          <option value="sepolia">Sepolia Testnet</option>
                          <option value="arbitrum">Arbitrum One</option>
                          <option value="polygon">Polygon PoS</option>
                        </select>
                      </label>
                      <label className="space-y-1.5 text-xs text-foreground">
                        <span className="block">Nome do perfil<span className="text-primary">*</span></span>
                        <Input value={walletProfileName} onChange={(event) => setWalletProfileName(event.target.value)} placeholder={user.name} className={fieldClassName} />
                      </label>
                      <label className="space-y-1.5 text-xs text-foreground">
                        <span className="block">Endereço da carteira<span className="text-primary">*</span></span>
                        <Input value={primaryWallet.address} readOnly className={`${fieldClassName} font-mono`} />
                      </label>
                      <label className="space-y-1.5 text-xs text-foreground">
                        <span className="block">Tipo de carteira<span className="text-primary">*</span></span>
                        <Input value={providerName[primaryWallet.provider]} readOnly className={fieldClassName} />
                      </label>
                      <label className="space-y-1.5 text-xs text-foreground">
                        <span className="block">ENS ou carteira secundária (opcional)</span>
                        <Input value={ensOrSecondary} onChange={(event) => setEnsOrSecondary(event.target.value)} placeholder="ENS ou endereço de carteira" className={fieldClassName} />
                      </label>
                      <label className="space-y-1.5 text-xs text-foreground">
                        <span className="block">Código de indicação<span className="text-primary">*</span></span>
                        <Input value={referralCode} onChange={(event) => setReferralCode(event.target.value)} className={fieldClassName} />
                      </label>
                      <label className="space-y-1.5 text-xs text-foreground">
                        <span className="block">E-mail<span className="text-primary">*</span></span>
                        <Input value={user.email} readOnly className={fieldClassName} />
                      </label>
                      <label className="space-y-1.5 text-xs text-foreground">
                        <span className="block">Nome ENS<span className="text-primary">*</span></span>
                        <div className="flex h-10 min-w-0 gap-2.5">
                          <select value={ensSuffix} onChange={(event) => setEnsSuffix(event.target.value)} aria-label="Sufixo ENS" className="h-10 w-[78px] shrink-0 border border-border bg-background px-2 text-xs text-foreground outline-none focus:border-primary">
                            <option value="eth">.eth</option>
                          </select>
                          <Input aria-label="Nome ENS" value={ensName} onChange={(event) => setEnsName(event.target.value)} className="h-10 min-w-0 flex-1 rounded-none border-border bg-transparent px-3 text-xs" />
                        </div>
                      </label>
                      <div className="md:col-span-2">
                        <Button
                          type="button"
                          onClick={() => {
                            setWalletProfileError(null)
                            setWalletProfileMessage(null)
                            updateWalletProfileMutation.mutate({
                              walletId: primaryWallet.id,
                              fields: { walletAlias, profileName: walletProfileName, ensOrSecondary, referralCode, ensName, ensSuffix },
                            })
                          }}
                          isLoading={updateWalletProfileMutation.isPending}
                          className="h-10 min-w-[131px] rounded-sm px-5 text-xs font-bold"
                        >
                          Salvar carteira
                        </Button>
                      </div>
                    </>
                  )
                })()}
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-foreground-muted">Você ainda não cadastrou uma carteira principal.</p>
              </div>
            )}
          </section>

          <section className="space-y-3 border-t border-border pt-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-foreground">Carteira secundária</h2>
                <p className="mt-1 text-xs text-foreground-muted">
                  {wallets.some((wallet) => !wallet.isPrimary) ? 'Suas outras carteiras registradas.' : 'Você ainda não adicionou uma carteira secundária.'}
                </p>
              </div>
              <button onClick={() => setAddWalletOpen(true)} className="text-xs font-semibold text-primary hover:text-primary-hover">
                <span className="mr-2 inline-block h-3.5 w-3.5 rounded-full border border-primary align-middle" aria-hidden="true" />
                Igual à carteira principal <span className="ml-1">Adicionar</span>
              </button>
            </div>
            {wallets.filter((wallet) => !wallet.isPrimary).map((wallet) => (
              <div key={wallet.id} data-testid="wallet-card" className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 py-3 text-xs">
                <div className="min-w-0 space-y-1">
                  <strong className="font-semibold text-foreground">{wallet.provider}</strong>
                  <p className="truncate font-mono text-[11px] text-foreground-muted">{wallet.address}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="sm" onClick={() => setPrimaryWalletMutation.mutate(wallet.id)} className="h-8 rounded-sm px-3 text-[10px]">Definir como principal</Button>
                  <Button type="button" variant="ghost" size="icon-sm" onClick={() => removeWalletMutation.mutate(wallet.id)} className="h-auto w-auto p-1 text-foreground-muted hover:bg-transparent hover:text-red-400" aria-label="Remover carteira"><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}
          </section>

          {/* Add Wallet Modal */}
          <Dialog open={addWalletOpen} onOpenChange={setAddWalletOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Adicionar Nova Carteira</DialogTitle>
                <DialogDescription>Conecte um novo endereço público Ethereum para liquidação de NFTs.</DialogDescription>
              </DialogHeader>

              {walletError && (
                <Alert variant="destructive" className="gap-2 rounded-md p-3">
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription>{walletError}</AlertDescription>
                </Alert>
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
