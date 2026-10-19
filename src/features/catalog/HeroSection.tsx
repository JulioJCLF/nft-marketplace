import React from 'react'
import { ArrowRight, Flame, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Link } from '@tanstack/react-router'
import { formatEth } from '@/lib/eth'
import { useCart } from '@/features/cart/CartContext'
import { INITIAL_NFTS } from '@/mocks/fixtures'

export const HeroSection: React.FC = () => {
  const { addToCart } = useCart()
  const featuredNFT = INITIAL_NFTS[0] // Bored Ape #7090

  return (
    <section className="relative overflow-hidden pt-8 pb-16 lg:py-20 border-b border-border bg-gradient-to-b from-background via-surface/40 to-background">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 w-80 h-80 bg-amber-600/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Text Content */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/40 bg-primary/10 text-primary text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Bem-vindo à Kurio</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.1]">
              SEJA DONO DO FUTURO DA <span className="text-primary">ARTE DIGITAL</span>
            </h1>

            <p className="text-base sm:text-lg text-foreground-muted max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte digital rara, apoie artistas e tenha uma parte da cultura da internet.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <Link to="/" search={{ category: 'all' }}>
                <Button size="lg" className="gap-2 font-bold w-full sm:w-auto uppercase tracking-wide">
                  <span>EXPLORAR</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/nft/$nftId" params={{ nftId: featuredNFT.id }}>
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Ver Obra em Destaque
                </Button>
              </Link>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-6 pt-6 border-t border-border/80 max-w-lg mx-auto lg:mx-0">
              <div>
                <div className="text-2xl sm:text-3xl font-extrabold text-foreground font-mono">10k+</div>
                <div className="text-xs text-foreground-muted mt-0.5">Obras Listadas</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-extrabold text-primary font-mono">145k+</div>
                <div className="text-xs text-foreground-muted mt-0.5">Volume ETH</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-extrabold text-foreground font-mono">3.4k+</div>
                <div className="text-xs text-foreground-muted mt-0.5">Colecionadores</div>
              </div>
            </div>
          </div>

          {/* Right Featured Hero NFT Card */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-2xl relative group hover:border-primary/50 transition-all duration-300">
              {/* Highlight badge */}
              <div className="absolute top-7 left-7 z-20 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md border border-amber-500/40 text-amber-300 text-xs font-bold">
                <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>Em Alta</span>
              </div>

              {/* Main Image */}
              <Link to="/nft/$nftId" params={{ nftId: featuredNFT.id }} className="block overflow-hidden rounded-xl aspect-square bg-surface-secondary relative">
                <img
                  src={featuredNFT.image}
                  alt={featuredNFT.name}
                  fetchPriority="high"
                  width="500"
                  height="500"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </Link>

              {/* Info Bottom */}
              <div className="pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                      {featuredNFT.name}
                    </h2>
                    <p className="text-xs text-foreground-muted">{featuredNFT.collection}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-foreground-muted block uppercase">Preço Atual</span>
                    <span className="text-base font-extrabold font-mono text-primary">
                      {formatEth(featuredNFT.price)}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <Button
                    onClick={() => addToCart(featuredNFT, 1)}
                    className="flex-1 font-bold"
                  >
                    Adicionar ao Carrinho
                  </Button>
                  <Link to="/nft/$nftId" params={{ nftId: featuredNFT.id }} className="flex-1">
                    <Button variant="outline" className="w-full font-semibold">
                      Detalhes
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
