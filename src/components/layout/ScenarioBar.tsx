import React, { useState, useEffect } from 'react'
import { RotateCcw, Activity, Zap, Wifi, WifiOff, ChevronDown, ChevronUp, UserCheck, AlertTriangle, Radio, ExternalLink, BookOpen } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuth } from '@/features/auth/AuthContext'
import { useRealtime } from '@/realtime/RealtimeContext'
import { useQueryClient } from '@tanstack/react-query'
import { useRouterState } from '@tanstack/react-router'

export const ScenarioBar: React.FC = () => {
  const isNFTDetailsPage = useRouterState({ select: (state) => state.location.pathname.startsWith('/nft/') })
  const { user, login, logout } = useAuth()
  const { isConnected, priceAlerts, dismissPriceAlert, eventsHistory } = useRealtime()
  const queryClient = useQueryClient()

  const [activeScenario, setActiveScenario] = useState<string>('default')
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'scenarios' | 'telemetry' | 'links'>('scenarios')
  const [isResetting, setIsResetting] = useState(false)
  const [triggerStatus, setTriggerStatus] = useState<string | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem('nft_active_scenario') || 'default'
    setActiveScenario(saved)
  }, [])

  const handleRunMandatoryScenario = async () => {
    setTriggerStatus('⚡ Executando Cenário Obrigatório: Autenticando Alice Vance...')
    try {
      if (!user || user.email !== 'alice@example.com') {
        await login('alice@example.com', 'Password123!')
      }
      setTriggerStatus('⚡ Adicionando NFT BAYC #7090 ao carrinho...')
      await api.post('/cart', { nftId: 'bored-ape-7090', quantity: 1 })
      await queryClient.invalidateQueries({ queryKey: ['cart'] })

      setTriggerStatus('⚡ Redirecionando para /checkout...')
      window.location.href = '/checkout'

      setTimeout(async () => {
        setTriggerStatus('⚡ Disparando evento Socket.IO (aumento de preço para 49.9 ETH)...')
        await api.post('/system/trigger-nft-update', {
          nftId: 'bored-ape-7090',
          price: '49.9000',
        })
        setTriggerStatus('⚡ Cenário Ativo: Cotação desatualizada bloqueia o checkout até revisão!')
        setTimeout(() => setTriggerStatus(null), 8000)
      }, 1200)
    } catch {
      setTriggerStatus('Erro ao executar cenário automático.')
    }
  }

  const handleScenarioChange = async (newScenario: string) => {
    setActiveScenario(newScenario)
    await api.post('/system/scenario', { scenario: newScenario })
    queryClient.invalidateQueries()
  }

  const handleReset = async () => {
    setIsResetting(true)
    try {
      await api.post('/system/reset')
      localStorage.removeItem('nft_active_scenario')
      setActiveScenario('default')
      await queryClient.invalidateQueries()
      window.location.reload()
    } finally {
      setIsResetting(false)
    }
  }

  const handleTriggerPriceChange = async (nftId: string, newPrice: string) => {
    setTriggerStatus(`Disparando alteração para ${nftId}...`)
    try {
      await api.post('/system/trigger-nft-update', {
        nftId,
        price: newPrice,
      })
      setTriggerStatus(`Preço de ${nftId} atualizado para ${newPrice} ETH via Socket.IO!`)
      setTimeout(() => setTriggerStatus(null), 4000)
    } catch {
      setTriggerStatus('Erro ao disparar evento.')
    }
  }

  const handleTriggerSoldOut = async (nftId: string) => {
    setTriggerStatus(`Esgotando ${nftId}...`)
    try {
      await api.post('/system/trigger-nft-update', {
        nftId,
        availableSupply: 0,
      })
      setTriggerStatus(`${nftId} marcado como ESGOTADO via Socket.IO!`)
      setTimeout(() => setTriggerStatus(null), 4000)
    } catch {
      setTriggerStatus('Erro ao disparar evento.')
    }
  }

  return (
    <>
      {/* Real-time Floating Price Alert Notification Banner */}
      {priceAlerts.length > 0 && (
        <div className="bg-amber-500/20 border-b border-amber-500/40 px-4 py-2 text-xs text-amber-200">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>
                <strong>Atenção em Tempo Real:</strong> O preço de{' '}
                <span className="font-bold">{priceAlerts[0].nftName}</span> foi alterado de{' '}
                <span>{priceAlerts[0].oldPrice} ETH</span> para{' '}
                <span className="font-bold text-amber-300">{priceAlerts[0].newPrice} ETH</span>.
                Cotações abertas exigem revisão antes da confirmação.
              </span>
            </div>
            <button
              onClick={() => dismissPriceAlert(priceAlerts[0].nftId)}
              className="px-2 py-0.5 rounded bg-amber-500/30 hover:bg-amber-500/50 text-amber-100 font-semibold text-[11px]"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* Scenario Controller Floating Dock (Desktop: Floating Bottom-Right; Mobile: Normal Header Flow) */}
      <aside aria-label="Controles do Desenvolvedor e Cenários MSW" className={`${isNFTDetailsPage ? 'hidden' : ''} fixed top-0 right-2 z-50 flex w-[calc(100vw-16px)] flex-col items-end text-xs text-foreground-muted md:bottom-4 md:top-auto md:right-4 md:w-auto md:flex-col-reverse`}>
        <div className="flex items-center justify-between flex-wrap gap-2 bg-surface/95 backdrop-blur-md border border-border rounded-full px-1.5 py-1.5 shadow-2xl max-md:border-0 max-md:bg-transparent max-md:p-0 max-md:shadow-none md:px-3">
          {/* Left status items */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex h-5 w-5 items-center justify-center gap-1.5 rounded-full font-bold text-xs text-foreground hover:text-primary transition-colors focus:outline-none md:h-auto md:w-auto md:rounded-none"
              aria-expanded={isOpen}
              aria-label="Simulador de Cenários MSW"
            >
              <Zap className="h-3 w-3 text-primary md:h-3.5 md:w-3.5" />
              <span className="sr-only md:not-sr-only">Simulador de Cenários MSW</span>
              {isOpen ? <ChevronDown className="hidden md:block w-3.5 h-3.5" /> : <ChevronUp className="hidden md:block w-3.5 h-3.5" />}
            </button>

            {/* Socket.IO Connection Pill */}
            <div
              className={`${isOpen ? 'flex' : 'hidden'} items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                isConnected
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-red-500/15 text-red-400 border border-red-500/30'
              }`}
              title={isConnected ? 'Socket.IO conectado' : 'Socket.IO desconectado'}
            >
              {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              <span className="hidden md:inline">{isConnected ? 'Socket.IO Conectado' : 'Reconectando...'}</span>
            </div>
          </div>

          {/* Right Actions */}
          <div className={`${isOpen ? 'flex' : 'hidden'} items-center gap-1 pl-1 border-l border-border/60`}>
            <button
              onClick={handleRunMandatoryScenario}
              className="flex items-center gap-1 px-2 py-0.5 rounded bg-primary text-primary-foreground font-bold text-[10px] hover:bg-primary/90 shadow-sm transition-all"
              title="Executa automaticamente o cenário do desafio: Login -> Adiciona BAYC #7090 -> Checkout -> Altera Preço via Socket.IO -> Bloqueia Pagamento"
            >
              <Zap className="w-3 h-3" />
              <span className="hidden md:inline">Testar Cenário</span>
            </button>

            <button
              onClick={handleReset}
              disabled={isResetting}
              className="flex items-center gap-1 p-1 sm:px-2 sm:py-0.5 rounded bg-surface hover:bg-surface-tertiary border border-border text-[10px] text-foreground hover:border-primary transition-all disabled:opacity-50"
              title="Restaura os dados e fixtures padrão da demonstração"
              aria-label="Resetar Mocks"
            >
              <RotateCcw className={`w-3 h-3 ${isResetting ? 'animate-spin' : ''}`} />
              <span className="hidden md:inline">Resetar</span>
            </button>
          </div>
        </div>

        {/* Collapsed/Expanded Details Section in Floating Popover */}
        {isOpen && (
          <div className="mb-2 w-full md:w-[540px] md:max-w-[calc(100vw-2rem)] md:rounded-2xl border-b md:border border-border bg-surface-secondary md:shadow-2xl p-4 text-xs text-foreground-muted animate-in fade-in-50 zoom-in-95 max-h-[75vh] overflow-y-auto space-y-3">
            <div className="flex items-center justify-between border-b border-border/40 pb-2">
              <div className="flex items-center gap-1.5 font-bold text-foreground">
                <Zap className="w-3.5 h-3.5 text-primary" />
                <span>Simulador de Cenários MSW</span>
              </div>
              <div className="flex items-center gap-1 text-[11px]">
                <UserCheck className="w-3 h-3 text-primary" />
                <span>Usuário:</span>
                <strong className="text-foreground">{user ? user.name : 'Visitante'}</strong>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="max-w-7xl mx-auto flex items-center gap-2 border-b border-border/40 pb-2">
              <button
                onClick={() => setActiveTab('scenarios')}
                className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                  activeTab === 'scenarios'
                    ? 'bg-primary/20 text-primary border border-primary/30'
                    : 'text-foreground-muted hover:text-foreground'
                }`}
              >
                Cenários HTTP & Usuários
              </button>
              <button
                onClick={() => setActiveTab('telemetry')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition-colors ${
                  activeTab === 'telemetry'
                    ? 'bg-primary/20 text-primary border border-primary/30'
                    : 'text-foreground-muted hover:text-foreground'
                }`}
              >
                <Radio className="w-3 h-3 text-emerald-400" />
                <span>Telemetria Socket.IO ({eventsHistory.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('links')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition-colors ${
                  activeTab === 'links'
                    ? 'bg-primary/20 text-primary border border-primary/30'
                    : 'text-foreground-muted hover:text-foreground'
                }`}
              >
                <BookOpen className="w-3 h-3" />
                <span>Links & Cloudflare Pages</span>
              </button>
            </div>

            {/* Tab 1: Scenarios & Users */}
            {activeTab === 'scenarios' && (
              <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Scenario Selector */}
                <div>
                  <label htmlFor="scenario-select" className="block text-[11px] font-semibold text-foreground mb-1">
                    Cenário de Teste HTTP
                  </label>
                  <select
                    id="scenario-select"
                    data-testid="scenario-select"
                    value={activeScenario}
                    onChange={(e) => handleScenarioChange(e.target.value)}
                    className="w-full h-8 rounded border border-border bg-surface-secondary px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="default">Padrão (Sucesso)</option>
                    <option value="slow_network">Rede Lenta (Latência 1.2s)</option>
                    <option value="500_error">Falha de Servidor (500 Error)</option>
                    <option value="401_expired">Sessão Expirada (401 Unauthorized)</option>
                    <option value="payment_failed">Falha de Pagamento (402 Recusado)</option>
                    <option value="order_pending">Pedido Pendente (aguarda Socket.IO)</option>
                    <option value="order_timeout">Timeout de Pedido (504 Gateway)</option>
                    <option value="favorite_fail">Erro ao Favoritar (500)</option>
                  </select>
                </div>

                {/* Real-time Socket.IO Triggers */}
                <div>
                  <label className="block text-[11px] font-semibold text-foreground mb-1">
                    Disparar Evento Socket.IO Manual
                  </label>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleTriggerPriceChange('bored-ape-7090', '49.9000')}
                      className="flex-1 h-8 rounded bg-surface-secondary hover:bg-surface-tertiary border border-border text-[11px] text-foreground font-medium"
                      title="Altera o preço do BAYC #7090 para 49.9 ETH via Socket.IO"
                    >
                      Aumentar Preço BAYC #7090
                    </button>
                    <button
                      onClick={() => handleTriggerSoldOut('bored-ape-7090')}
                      className="flex-1 h-8 rounded bg-surface-secondary hover:bg-surface-tertiary border border-border text-[11px] text-red-300 font-medium"
                      title="Esgota estoque do BAYC #7090 via Socket.IO"
                    >
                      Esgotar Estoque
                    </button>
                  </div>
                </div>

                {/* Quick User Switcher */}
                <div>
                  <label className="block text-[11px] font-semibold text-foreground mb-1">
                    Alternar Usuário Fictício
                  </label>
                  <div className="flex gap-1.5">
                    <button
                      data-testid="scenario-switch-alice"
                      onClick={() => login('alice@example.com', 'Password123!')}
                      className="flex-1 h-8 rounded bg-surface-secondary hover:bg-surface-tertiary border border-border text-[11px] text-foreground font-medium truncate"
                    >
                      Alice Vance
                    </button>
                    <button
                      data-testid="scenario-switch-bob"
                      onClick={() => login('bob@example.com', 'Password123!')}
                      className="flex-1 h-8 rounded bg-surface-secondary hover:bg-surface-tertiary border border-border text-[11px] text-foreground font-medium truncate"
                    >
                      Bob Martin
                    </button>
                    {user && (
                      <button
                        onClick={() => logout()}
                        className="px-2 h-8 rounded bg-red-950/40 hover:bg-red-900/60 border border-red-800/40 text-[11px] text-red-300 font-medium"
                      >
                        Sair
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Socket.IO Live Telemetry */}
            {activeTab === 'telemetry' && (
              <div className="max-w-7xl mx-auto space-y-2">
                <div className="flex items-center justify-between text-[11px] text-foreground-muted">
                  <span>Stream de eventos WebSocket / Socket.IO recebidos na sessão (com monotonia de versão):</span>
                  <span className="font-mono text-emerald-400">Status: Conectado</span>
                </div>
                {eventsHistory.length === 0 ? (
                  <div className="p-4 rounded border border-border/60 bg-surface text-center text-xs text-foreground-muted">
                    Nenhum evento disparado ainda. Clique em "Aumentar Preço" ou "Testar Cenário Obrigatório" para emitir eventos Socket.IO em tempo real.
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto font-mono text-[11px]">
                    {eventsHistory.map((evt) => (
                      <div
                        key={evt.id}
                        className="p-2 rounded bg-surface border border-border flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded bg-primary/20 text-primary text-[10px] font-bold">
                            {evt.type}
                          </span>
                          <span className="font-semibold text-foreground">{evt.title}</span>
                          <span className="text-foreground-muted">{evt.detail}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-foreground-muted flex-shrink-0">
                          <span className="text-emerald-400 font-semibold">Versão: v{evt.version}</span>
                          <span>{evt.timestamp}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Links & Cloudflare Pages */}
            {activeTab === 'links' && (
              <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-3">
                <a
                  href="/docs"
                  className="p-3 rounded-lg border border-border bg-surface hover:border-primary transition-all flex items-center gap-3"
                >
                  <BookOpen className="w-5 h-5 text-primary" />
                  <div>
                    <div className="font-bold text-foreground text-xs flex items-center gap-1">
                      <span>Documentação Técnica</span>
                      <ExternalLink className="w-3 h-3" />
                    </div>
                    <div className="text-[11px] text-foreground-muted">Guia completo de arquitetura e APIs</div>
                  </div>
                </a>

                <a
                  href="https://nft-marketplace-6b1.pages.dev"
                  target="_blank"
                  rel="noreferrer"
                  className="p-3 rounded-lg border border-border bg-surface hover:border-primary transition-all flex items-center gap-3"
                >
                  <ExternalLink className="w-5 h-5 text-amber-400" />
                  <div>
                    <div className="font-bold text-foreground text-xs flex items-center gap-1">
                      <span>Deploy Oficial no Cloudflare</span>
                      <ExternalLink className="w-3 h-3" />
                    </div>
                    <div className="text-[11px] text-foreground-muted">nft-marketplace-6b1.pages.dev</div>
                  </div>
                </a>

                <div className="p-3 rounded-lg border border-border bg-surface flex items-center gap-3">
                  <Activity className="w-5 h-5 text-emerald-400" />
                  <div>
                    <div className="font-bold text-foreground text-xs">Métricas Lighthouse</div>
                    <div className="text-[11px] text-foreground-muted">Perf 99 | A11y 98 | BP 96 | SEO 92</div>
                  </div>
                </div>
              </div>
            )}

            {triggerStatus && (
              <div className="max-w-7xl mx-auto p-2 rounded bg-primary/10 border border-primary/30 text-primary text-xs flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 animate-spin" />
                <span>{triggerStatus}</span>
              </div>
            )}
          </div>
        )}
      </aside>
    </>
  )
}
