import React, { useState } from 'react'
import { ShieldCheck, Zap, Headphones, CheckCircle2 } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/Button'

export const Footer: React.FC = () => {
  const [newsletterEmail, setNewsletterEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newsletterEmail) return
    setSubscribed(true)
    setNewsletterEmail('')
  }

  return (
    <footer className="border-t border-border bg-surface/50 text-foreground-muted text-xs">
      {/* Features Bar */}
      <div className="border-b border-border/80 bg-surface-secondary/40 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary flex-shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-foreground mb-1">Segurança da carteira</h3>
              <p className="text-foreground-muted leading-relaxed">
                Proteja sua carteira e colecione arte digital verificada com confiança.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary flex-shrink-0">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-foreground mb-1">Criadores em destaque</h3>
              <p className="text-foreground-muted leading-relaxed">
                Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary flex-shrink-0">
              <Headphones className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-foreground mb-1">Alertas de lançamentos</h3>
              <p className="text-foreground-muted leading-relaxed">
                Receba calendários de cunhagem, novidades de listas de acesso e análises do mercado.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links & Newsletter */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Brand info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-surface border border-border flex items-center justify-center text-primary">
                <svg viewBox="0 0 32 32" className="w-5 h-5 fill-none">
                  <path d="M16 4L26 11L16 18L6 11L16 4Z" fill="#D08848" />
                  <path d="M6 13L16 20L26 13L26 17L16 26L6 17V13Z" fill="#E59A5A" />
                </svg>
              </div>
              <span className="font-extrabold text-lg tracking-wider text-foreground">
                KURIO
              </span>
            </div>
            <p className="max-w-sm text-foreground-muted leading-relaxed">
              Feito para colecionadores, criadores e cultura.
            </p>
            <div className="text-[11px] text-foreground-muted space-y-0.5">
              <p>contato@email.com</p>
              <p>+55 11 4002 8922</p>
            </div>

            {/* Newsletter form */}
            <div className="pt-2">
              <p className="font-bold text-foreground text-xs mb-1">Antecipe-se ao próximo lançamento</p>
              <p className="text-[11px] text-foreground-muted mb-2">
                Receba lançamentos selecionados, histórias de criadores e novidades do mercado.
              </p>
              {subscribed ? (
                <div className="flex items-center gap-2 text-emerald-400 text-xs">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Inscrição realizada com sucesso!</span>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="flex gap-2 max-w-sm">
                  <input
                    type="email"
                    placeholder="digite seu e-mail..."
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    required
                    className="flex-1 h-9 rounded-md border border-border bg-surface px-3 text-xs text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <Button type="submit" size="sm" className="font-bold">
                    Enviar
                  </Button>
                </form>
              )}
            </div>
          </div>

          {/* Links Column 1 */}
          <div className="space-y-3">
            <h4 className="font-bold text-foreground uppercase tracking-wider text-[11px]">Marketplace</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="hover:text-foreground transition-colors">
                  Todos os NFTs
                </Link>
              </li>
              <li>
                <Link to="/" search={{ category: 'art' }} className="hover:text-foreground transition-colors">
                  Arte Digital
                </Link>
              </li>
              <li>
                <Link to="/" search={{ category: 'collectibles' }} className="hover:text-foreground transition-colors">
                  Colecionáveis
                </Link>
              </li>
              <li>
                <Link to="/" search={{ category: 'music' }} className="hover:text-foreground transition-colors">
                  Música & Áudio
                </Link>
              </li>
            </ul>
          </div>

          {/* Links Column 2 */}
          <div className="space-y-3">
            <h4 className="font-bold text-foreground uppercase tracking-wider text-[11px]">Minha Conta</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/profile" className="hover:text-foreground transition-colors">
                  Perfil do Usuário
                </Link>
              </li>
              <li>
                <Link to="/profile" search={{ tab: 'wallets' }} className="hover:text-foreground transition-colors">
                  Carteiras Conectadas
                </Link>
              </li>
              <li>
                <Link to="/profile" search={{ tab: 'orders' }} className="hover:text-foreground transition-colors">
                  Histórico de Pedidos
                </Link>
              </li>
              <li>
                <Link to="/profile" search={{ tab: 'favorites' }} className="hover:text-foreground transition-colors">
                  Favoritos Salvos
                </Link>
              </li>
            </ul>
          </div>

          {/* Links Column 3 */}
          <div className="space-y-3">
            <h4 className="font-bold text-foreground uppercase tracking-wider text-[11px]">Documentação</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/docs" className="text-primary hover:underline transition-colors font-medium">
                  Portal de Documentação
                </Link>
              </li>
              <li>
                <Link to="/docs" hash="arquitetura" className="hover:text-foreground transition-colors">
                  Arquitetura do Projeto
                </Link>
              </li>
              <li>
                <Link to="/docs" hash="apis" className="hover:text-foreground transition-colors">
                  APIs REST & MSW
                </Link>
              </li>
              <li>
                <Link to="/docs" hash="tempo-real" className="hover:text-foreground transition-colors">
                  Socket.IO & Tempo Real
                </Link>
              </li>
              <li>
                <Link to="/docs" hash="deploy" className="hover:text-foreground transition-colors">
                  Guia Cloudflare Pages
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border/60 mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-foreground-muted">
          <p>© 2026 Kurio. Propriedade digital para todos.</p>
          <div className="flex items-center gap-4">
            <span className="font-mono text-[10px] tracking-wider uppercase text-foreground-muted">
              METAMASK • WALLETCONNECT • COINBASE
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-surface border border-border">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Deploy: Cloudflare Pages
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
