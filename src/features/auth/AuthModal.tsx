import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuth } from './AuthContext'
import { useNavigate } from '@tanstack/react-router'
import { AlertCircle, UserCheck, Shield } from 'lucide-react'

export const AuthModal: React.FC = () => {
  const {
    authModalOpen,
    setAuthModalOpen,
    authModalMode,
    setAuthModalMode,
    login,
    register,
    redirectAfterAuth,
    setRedirectAfterAuth,
    isAuthenticated,
  } = useAuth()

  const navigate = useNavigate()

  // Form states
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (isAuthenticated) {
      setAuthModalOpen(false)
    }
  }, [isAuthenticated, setAuthModalOpen])

  const handleClose = () => {
    setAuthModalOpen(false)
    setErrorMessage(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage(null)

    try {
      if (authModalMode === 'login') {
        await login(email, password)
      } else {
        await register(name, email, password)
      }

      handleClose()

      if (redirectAfterAuth) {
        navigate({ to: redirectAfterAuth })
        setRedirectAfterAuth(null)
      }
    } catch (err: unknown) {
      setErrorMessage((err as Error).message || 'Falha na autenticação')
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickLogin = (userEmail: string) => {
    setEmail(userEmail)
    setPassword('Password123!')
  }

  return (
    <Dialog open={authModalOpen} onOpenChange={setAuthModalOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mx-auto mb-2 text-primary">
            <Shield className="w-6 h-6" />
          </div>
          <DialogTitle className="text-center text-xl">
            {authModalMode === 'login' ? 'Conectar ao Marketplace' : 'Criar Nova Conta'}
          </DialogTitle>
          <DialogDescription className="text-center">
            {authModalMode === 'login'
              ? 'Acesse sua carteira e gerencie suas obras digitais'
              : 'Junte-se aos maiores colecionadores da web3'}
          </DialogDescription>
        </DialogHeader>

        {/* Mode Toggle Tabs */}
        <div className="flex rounded-lg bg-surface-secondary p-1 border border-border">
          <button
            type="button"
            onClick={() => {
              setAuthModalMode('login')
              setErrorMessage(null)
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
              authModalMode === 'login'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-foreground-muted hover:text-foreground'
            }`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthModalMode('register')
              setErrorMessage(null)
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
              authModalMode === 'register'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-foreground-muted hover:text-foreground'
            }`}
          >
            Cadastrar
          </button>
        </div>

        {/* Quick Test Accounts Helper */}
        {authModalMode === 'login' && (
          <div className="p-3 rounded-lg border border-border/80 bg-surface-secondary/40 text-xs space-y-2">
            <div className="flex items-center gap-1.5 text-primary font-semibold">
              <UserCheck className="w-3.5 h-3.5" />
              <span>Contas de Teste Pré-configuradas:</span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('alice@example.com')}
                className="flex-1 py-1 px-2 rounded bg-surface hover:bg-surface-tertiary border border-border text-[11px] text-foreground font-mono truncate"
              >
                Alice Vance
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('bob@example.com')}
                className="flex-1 py-1 px-2 rounded bg-surface hover:bg-surface-tertiary border border-border text-[11px] text-foreground font-mono truncate"
              >
                Bob Martin
              </button>
            </div>
          </div>
        )}

        {errorMessage && (
          <div
            className="p-3 rounded-md bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-center gap-2"
            role="alert"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {authModalMode === 'register' && (
            <div>
              <label className="block text-xs font-medium text-foreground-muted mb-1.5">Nome Completo</label>
              <Input
                type="text"
                placeholder="Seu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-foreground-muted mb-1.5">E-mail</label>
            <Input
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground-muted mb-1.5">Senha</label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full font-bold mt-2" isLoading={isLoading}>
            {authModalMode === 'login' ? 'Conectar' : 'Criar Conta'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
