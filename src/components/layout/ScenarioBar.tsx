import React, { useState, useEffect } from 'react'
import { RotateCcw, Activity, Zap, Wifi, WifiOff, ChevronDown, ChevronUp, UserCheck, AlertTriangle } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuth } from '@/features/auth/AuthContext'
import { useRealtime } from '@/realtime/RealtimeContext'
import { useQueryClient } from '@tanstack/react-query'

export const ScenarioBar: React.FC = () => {
  const { user, login, logout } = useAuth()
  const { isConnected, priceAlerts, dismissPriceAlert } = useRealtime()
  const queryClient = useQueryClient()

  const [activeScenario, setActiveScenario] = useState<string>('default')
  const [isOpen, setIsOpen] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [triggerStatus, setTriggerStatus] = useState<string | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem('nft_active_scenario') || 'default'
    setActiveScenario(saved)
  }, [])

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
                <span className="line-through">{priceAlerts[0].oldPrice} ETH</span> para{' '}
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

      {/* Scenario Controller Drawer / Bar */}
      <div className="bg-surface-secondary border-b border-border text-xs text-foreground-muted">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between flex-wrap gap-2">
          {/* Left status items */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center gap-1.5 font-bold text-foreground hover:text-primary transition-colors"
              aria-expanded={isOpen}
            >
              <Zap className="w-3.5 h-3.5 text-primary" />
              <span>Simulador de Cenários MSW</span>
              {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {/* Socket.IO Connection Pill */}
            <div
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                isConnected
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-red-500/15 text-red-400 border border-red-500/30'
              }`}
              title={isConnected ? 'Socket.IO conectado' : 'Socket.IO desconectado'}
            >
              {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              <span>{isConnected ? 'Socket.IO Conectado' : 'Reconectando...'}</span>
            </div>

            {/* Active User Indicator */}
            <div className="hidden sm:flex items-center gap-1 text-[11px]">
              <UserCheck className="w-3 h-3 text-primary" />
              <span>Usuário:</span>
              <strong className="text-foreground">{user ? user.name : 'Visitante'}</strong>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              disabled={isResetting}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-surface hover:bg-surface-tertiary border border-border text-[11px] text-foreground hover:border-primary transition-all disabled:opacity-50"
              title="Restaura os dados e fixtures padrão da demonstração"
            >
              <RotateCcw className={`w-3 h-3 ${isResetting ? 'animate-spin' : ''}`} />
              <span>Resetar Mocks</span>
            </button>
          </div>
        </div>

        {/* Collapsed Details Section */}
        {isOpen && (
          <div className="border-t border-border/60 bg-surface/80 px-4 py-3 space-y-3">
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
                  <option value="order_timeout">Timeout de Pedido (504 Gateway)</option>
                  <option value="favorite_fail">Erro ao Favoritar (500)</option>
                </select>
              </div>

              {/* Real-time Socket.IO Triggers */}
              <div>
                <label className="block text-[11px] font-semibold text-foreground mb-1">
                  Disparar Evento Socket.IO (Tempo Real)
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

            {triggerStatus && (
              <div className="max-w-7xl mx-auto p-2 rounded bg-primary/10 border border-primary/30 text-primary text-xs flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 animate-spin" />
                <span>{triggerStatus}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}
