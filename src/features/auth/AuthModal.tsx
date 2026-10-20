import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert, AlertDescription } from '@/components/ui/alert'
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
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickLogin('alice@example.com')}
                className="flex-1 h-auto py-1 px-2 rounded bg-surface hover:bg-surface-tertiary border-border text-[11px] text-foreground font-mono font-normal truncate"
              >
                Alice Vance
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickLogin('bob@example.com')}
                className="flex-1 h-auto py-1 px-2 rounded bg-surface hover:bg-surface-tertiary border-border text-[11px] text-foreground font-mono font-normal truncate"
              >
                Bob Martin
              </Button>
            </div>
          </div>
        )}

        {errorMessage && (
          <Alert variant="destructive" className="gap-2 rounded-md p-3">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {authModalMode === 'register' && (
            <div>
              <label htmlFor="auth-name" className="block text-xs font-medium text-foreground-muted mb-1.5">Nome Completo</label>
              <Input
                id="auth-name"
                type="text"
                placeholder="Seu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div>
            <label htmlFor="auth-email" className="block text-xs font-medium text-foreground-muted mb-1.5">E-mail</label>
            <Input
              id="auth-email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="auth-password" className="block text-xs font-medium text-foreground-muted mb-1.5">Senha</label>
            <Input
              id="auth-password"
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

        <div className="space-y-3 pt-1">
            <div className="flex items-center gap-3 text-[11px] text-foreground-muted">
              <span className="h-px flex-1 bg-border" />
              <span>Ou continue com</span>
              <span className="h-px flex-1 bg-border" />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => setErrorMessage(`${authModalMode === 'register' ? 'O cadastro' : 'O login'} com Google ainda não está disponível.`)}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-md border-border bg-transparent px-4 py-2 text-xs font-semibold text-foreground-muted hover:bg-transparent hover:border-primary/60 hover:text-foreground"
            >
              <svg viewBox="0 0 48 48" className="h-4 w-4" aria-hidden="true">
                <path fill="#4285F4" d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.1h6.6c3.9-3.6 6.1-8.8 6.1-15Z" />
                <path fill="#34A853" d="M24 44c5.5 0 10.1-1.8 13.5-4.8l-6.6-5.1c-1.8 1.2-4.1 2-6.9 2-5.3 0-9.8-3.6-11.4-8.4H5.8v5.2A20 20 0 0 0 24 44Z" />
                <path fill="#FBBC05" d="M12.6 27.7a12 12 0 0 1 0-7.4v-5.2H5.8a20 20 0 0 0 0 17.8l6.8-5.2Z" />
                <path fill="#EA4335" d="M24 11.9c3 0 5.7 1 7.8 3.1l5.8-5.8A19.4 19.4 0 0 0 24 4 20 20 0 0 0 5.8 15.1l6.8 5.2c1.6-4.8 6.1-8.4 11.4-8.4Z" />
              </svg>
              Continuar com Google
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setErrorMessage(`${authModalMode === 'register' ? 'O cadastro' : 'O login'} com Facebook ainda não está disponível.`)}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-md border-border bg-transparent px-4 py-2 text-xs font-semibold text-foreground-muted hover:bg-transparent hover:border-primary/60 hover:text-foreground"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-[#4267B2]" aria-hidden="true">
                <path d="M13.5 21v-8.2h2.8l.4-3.2h-3.2v-2c0-.9.3-1.6 1.6-1.6h1.7V3.1c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.3H7.3v3.2h2.8V21h3.4Z" />
              </svg>
              Continuar com Facebook
            </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
