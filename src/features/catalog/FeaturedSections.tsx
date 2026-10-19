import React from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { INITIAL_NFTS } from '@/mocks/fixtures'

export const FeaturedSections: React.FC = () => {
  const apeGreen = INITIAL_NFTS[0]
  const apeCyber = INITIAL_NFTS[2]

  return (
    <div className="space-y-16 py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Two Horizontal Promo Banners (Figma) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Promo 1 */}
        <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-surface to-surface-secondary p-8 flex flex-col justify-between group hover:border-primary/50 transition-all">
          <div className="space-y-3 z-10 max-w-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">Edição Limitada</span>
            <h3 className="text-2xl font-black text-foreground">Lançamentos gênesis de edição limitada</h3>
            <p className="text-xs text-foreground-muted leading-relaxed">
              Colecione edições escassas diretamente dos criadores antes da revelação pública.
            </p>
            <div className="pt-2">
              <Link to="/" search={{ category: 'art' }}>
                <Button size="sm" className="gap-2 font-bold">
                  <span>Explorar</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
          <img
            src={apeGreen.image}
            alt="Destaque gênesis"
            className="absolute -right-10 -bottom-10 w-56 h-56 object-cover rounded-full opacity-80 group-hover:scale-110 transition-transform duration-500 pointer-events-none"
          />
        </div>

        {/* Promo 2 */}
        <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-surface to-surface-secondary p-8 flex flex-col justify-between group hover:border-primary/50 transition-all">
          <div className="space-y-3 z-10 max-w-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Coleção Verificada</span>
            <h3 className="text-2xl font-black text-foreground">Arte digital selecionada e muito mais</h3>
            <p className="text-xs text-foreground-muted leading-relaxed">
              Explore novos artistas, coleções verificadas e obras digitais que definem a cultura.
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
            alt="Destaque arte selecionada"
            className="absolute -right-10 -bottom-10 w-56 h-56 object-cover rounded-full opacity-80 group-hover:scale-110 transition-transform duration-500 pointer-events-none"
          />
        </div>
      </div>

      {/* Diário da Cunhagem (Figma Section) */}
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">Diário da Cunhagem</h2>
          </div>
          <p className="text-xs text-foreground-muted mt-1">
            Histórias, guias e insights para colecionadores sobre o universo da propriedade digital.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              date: '12 de setembro  |  Leitura de 6 min',
              title: 'Como funciona a propriedade de NFTs',
              desc: 'Aprenda a colecionar, negociar e verificar ativos digitais.',
              image: '/nfts/bored-ape-7090.svg',
            },
            {
              date: '13 de setembro  |  Leitura de 2 min',
              title: '10 artistas digitais para acompanhar',
              desc: 'Conheça criadores que moldam a cultura digital.',
              image: '/nfts/bored-ape-8817.svg',
            },
            {
              date: '15 de setembro  |  Leitura de 3 min',
              title: 'Raridade, atributos e procedência',
              desc: 'Entenda raridade, procedência, direitos autorais e utilidade.',
              image: '/nfts/cyber-kong-124.svg',
            },
            {
              date: '15 de setembro  |  Leitura de 2 min',
              title: 'Como proteger sua carteira',
              desc: 'Proteja sua carteira, seus ativos e sua identidade.',
              image: '/nfts/golden-ape-4421.svg',
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl border border-border bg-surface hover:border-primary/50 transition-all space-y-3 group"
            >
              <div className="aspect-video rounded-xl overflow-hidden bg-surface-secondary border border-border/40">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <span className="text-[10px] text-foreground-muted block font-mono">{item.date}</span>
              <h3 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                {item.title}
              </h3>
              <p className="text-xs text-foreground-muted leading-relaxed line-clamp-2">
                {item.desc}
              </p>
              <Link
                to="/docs"
                className="inline-flex items-center gap-1.5 text-xs text-primary font-bold pt-1 hover:underline"
              >
                <span>Ler mais</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
