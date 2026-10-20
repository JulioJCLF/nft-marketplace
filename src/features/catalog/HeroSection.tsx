import React from 'react'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Link } from '@tanstack/react-router'
import { getNFTImageSrcSet } from '@/lib/nftImage'

export const HeroSection: React.FC = () => {
  return (
    <section className="relative overflow-hidden pt-[18px] pb-0 sm:py-8 lg:pt-8 lg:pb-[54px] border-b border-border bg-background">

      <div className="max-w-[1264px] mx-auto px-6 lg:px-8 relative z-10">
        {/* Mobile View: Compact Horizontal Card-Banner (< md) matching Frame 14:5226 */}
        <div className="md:hidden relative rounded-2xl bg-[#241A14] p-4 overflow-hidden">
          <div className="pointer-events-none absolute -left-1 -top-2 h-[190px] w-[190px] rounded-full bg-[#765339]/35" aria-hidden="true" />
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-[170px] w-[170px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#765339]/20" aria-hidden="true" />
          <div className="flex items-center justify-between gap-3 relative z-10">
            <div className="space-y-1.5 flex-1 min-w-0">
              <span className="text-[11px] font-mono tracking-wider text-foreground-muted block">
                Bem-vindo à Kurio
              </span>
              <h1 className="text-base sm:text-lg font-black tracking-tight text-foreground leading-tight font-mono">
                SEJA DONO DA<br />CULTURA DIGITAL
              </h1>
              <p className="text-[11px] text-foreground-muted line-clamp-3 leading-relaxed">
                Descubra NFTs selecionados de criadores do mundo todo.
              </p>
              <div className="pt-1">
                <Link
                  to="/"
                  search={{ category: 'all' }}
                  className="inline-flex items-center gap-1.5 text-primary hover:text-primary-hover font-bold text-xs font-mono tracking-wider transition-colors"
                >
                  <span>EXPLORAR</span><ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            <div className="relative shrink-0 pr-1 pb-1">
              <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-2xl overflow-hidden bg-surface-secondary">
                <img
                  src="/nfts/figma/img4_8459.avif"
                  srcSet={getNFTImageSrcSet('/nfts/figma/img4_8459.avif')}
                  sizes="(min-width: 768px) 450px, 128px"
                  alt="Emerald Ape"
                  fetchPriority="high"
                  width="144"
                  height="144"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-1.5 -left-1.5 w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden border-2 border-[#241A14] bg-surface-tertiary shadow-lg">
                <img src="/nfts/figma/img1_2986.avif" srcSet={getNFTImageSrcSet('/nfts/figma/img1_2986.avif')} sizes="36px" alt="Sage Nomad" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>

          {/* 3-dots Carousel Indicator (Mobile Frame 14:5226) */}
          <div className="relative mt-3 h-1.5 w-full">
            <div className="absolute left-1/2 top-0 flex -translate-x-1/2 items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span className="h-1.5 w-1.5 rounded-full bg-primary/40" />
              <span className="h-1.5 w-1.5 rounded-full bg-primary/40" />
            </div>
          </div>
        </div>

        {/* Desktop View: Balanced 2-Column Layout (md+) matching Frame 2:2 */}
        <div className="hidden md:block">
          <div className="grid md:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Text Content */}
            <div className="md:col-span-7 space-y-6 text-left">
              <span className="text-sm font-mono text-foreground">Bem-vindo à Kurio</span>

              <h1 className="text-4xl sm:text-5xl lg:text-[46px] font-black tracking-tight text-foreground leading-[1.08] lg:leading-[70px] font-mono">
                SEJA DONO DO FUTURO<br />
                DA ARTE DIGITAL
              </h1>

              <p className="text-sm sm:text-base text-foreground-muted max-w-lg leading-relaxed">
                Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte digital rara, apoie artistas e tenha uma parte da cultura da internet.
              </p>

              <div className="pt-2">
                <Link to="/" search={{ category: 'all' }}>
                <Button size="lg" className="px-8 py-3 font-bold uppercase tracking-wider bg-primary hover:bg-primary-hover text-primary-foreground rounded-md">
                    EXPLORAR
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right Featured Hero Image */}
            <div className="md:col-span-5 flex justify-center">
              <div className="relative aspect-square w-full max-w-[450px] rounded-2xl overflow-hidden bg-surface-secondary">
                <img
                  src="/nfts/figma/img4_8459.avif"
                  srcSet={getNFTImageSrcSet('/nfts/figma/img4_8459.avif')}
                  sizes="450px"
                  alt="Emerald Ape"
                  fetchPriority="high"
                  width="450"
                  height="450"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* 3-dots Carousel Indicator (Desktop Frame 2:2) */}
          <div className="absolute left-1/2 top-[398px] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary" />
            <span className="w-2 h-2 rounded-full bg-primary/40" />
            <span className="w-2 h-2 rounded-full bg-primary/40" />
          </div>
        </div>
      </div>
    </section>
  )
}
