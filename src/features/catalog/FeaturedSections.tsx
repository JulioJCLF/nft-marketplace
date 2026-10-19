import React from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { INITIAL_NFTS } from '@/mocks/fixtures'

export const FeaturedSections: React.FC = () => {
  const apeGreen = INITIAL_NFTS[0]
  const apeCyber = INITIAL_NFTS[2]

  const creators = [
    { name: 'Yuga Labs', avatar: '/avatars/yuga.svg', volume: '1,420 ETH', sales: '8,410' },
    { name: 'KongzOG', avatar: '/avatars/creator.svg', volume: '890 ETH', sales: '3,200' },
    { name: 'CyberApes', avatar: '/avatars/bob.svg', volume: '620 ETH', sales: '1,940' },
    { name: 'SamuraiDAO', avatar: '/avatars/alice.svg', volume: '480 ETH', sales: '1,120' },
  ]

  return (
    <div className="space-y-16 py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Two Horizontal Promo Banners */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Promo 1 */}
        <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-surface to-surface-secondary p-8 flex flex-col justify-between group hover:border-primary/50 transition-all">
          <div className="space-y-3 z-10 max-w-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">Coleção Oficial</span>
            <h3 className="text-2xl font-black text-foreground">Bored Ape Yacht Club</h3>
            <p className="text-xs text-foreground-muted leading-relaxed">
              O clube mais exclusivo da Web3 com benefícios ilimitados e eventos globais.
            </p>
            <div className="pt-2">
              <Link to="/" search={{ category: 'art' }}>
                <Button size="sm" className="gap-2 font-bold">
                  <span>Ver Obras</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
          <img
            src={apeGreen.image}
            alt="Bored Ape destaque"
            className="absolute -right-10 -bottom-10 w-56 h-56 object-cover rounded-full opacity-80 group-hover:scale-110 transition-transform duration-500 pointer-events-none"
          />
        </div>

        {/* Promo 2 */}
        <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-surface to-surface-secondary p-8 flex flex-col justify-between group hover:border-primary/50 transition-all">
          <div className="space-y-3 z-10 max-w-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Edição Limitada</span>
            <h3 className="text-2xl font-black text-foreground">CyberKongz VX</h3>
            <p className="text-xs text-foreground-muted leading-relaxed">
              Primatas cibernéticos gerados aleatoriamente prontos para o metaverso.
            </p>
            <div className="pt-2">
              <Link to="/" search={{ category: 'collectibles' }}>
                <Button size="sm" variant="secondary" className="gap-2 font-bold">
                  <span>Explorar</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
          <img
            src={apeCyber.image}
            alt="CyberKongz destaque"
            className="absolute -right-10 -bottom-10 w-56 h-56 object-cover rounded-full opacity-80 group-hover:scale-110 transition-transform duration-500 pointer-events-none"
          />
        </div>
      </div>

      {/* Top Creators Row */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <h2 className="text-xl font-bold text-foreground">Principais Criadores da Semana</h2>
            </div>
            <p className="text-xs text-foreground-muted mt-0.5">Artistas e estúdios com maior volume de negociação</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {creators.map((c, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-4 rounded-xl border border-border bg-surface hover:border-border-light transition-all"
            >
              <span className="font-mono font-bold text-xs text-foreground-muted w-4">{i + 1}</span>
              <img src={c.avatar} alt={c.name} className="w-10 h-10 rounded-full bg-surface-tertiary" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <strong className="text-xs font-bold text-foreground truncate">{c.name}</strong>
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary fill-primary/20 flex-shrink-0" />
                </div>
                <div className="flex items-center justify-between text-[11px] text-foreground-muted mt-0.5">
                  <span className="font-mono text-primary font-semibold">{c.volume}</span>
                  <span>{c.sales} vendas</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
