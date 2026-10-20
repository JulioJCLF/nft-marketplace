import React from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { INITIAL_NFTS } from '@/mocks/fixtures'
import { getNFTImageSrcSet } from '@/lib/nftImage'

export const FeaturedSections: React.FC = () => {
  const apeGreen = INITIAL_NFTS[0]
  const apeCyber = INITIAL_NFTS[2]

  return (
    <div className="space-y-12 py-8 max-w-[1264px] mx-auto px-6 lg:px-8">
      {/* Two Horizontal Promo Banners (Figma) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Promo 1 */}
        <div className="relative overflow-hidden rounded-lg bg-surface p-2 flex items-center gap-4 group">
          <img src={apeGreen.image} srcSet={getNFTImageSrcSet(apeGreen.image)} sizes="(min-width: 768px) 280px, 45vw" alt="Destaque gênesis" loading="lazy" className="w-[48%] aspect-square object-cover rounded-lg shrink-0" />
          <div className="space-y-2 z-10 flex-1 text-right">
            <h3 className="text-sm font-bold text-foreground">Lançamentos gênesis de edição limitada</h3>
            <p className="text-[11px] text-foreground-muted leading-relaxed">
              Colecione edições escassas diretamente dos criadores antes da revelação pública.
            </p>
            <div className="pt-2">
              <Link to="/" search={{ category: 'art' }}>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-primary">Explorar <ArrowRight className="w-3 h-3" /></span>
              </Link>
            </div>
          </div>
        </div>

        {/* Promo 2 */}
        <div className="relative overflow-hidden rounded-lg bg-surface p-2 flex items-center gap-4 group">
          <img src={apeCyber.image} srcSet={getNFTImageSrcSet(apeCyber.image)} sizes="(min-width: 768px) 280px, 45vw" alt="Destaque arte selecionada" loading="lazy" className="w-[48%] aspect-square object-cover rounded-lg shrink-0" />
          <div className="space-y-2 z-10 flex-1 text-right">
            <h3 className="text-sm font-bold text-foreground">Arte digital selecionada e muito mais</h3>
            <p className="text-[11px] text-foreground-muted leading-relaxed">
              Explore novos artistas, coleções verificadas e obras digitais que definem a cultura.
            </p>
            <div className="pt-2">
              <Link to="/" search={{ category: 'collectibles' }}>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-primary">Explorar <ArrowRight className="w-3 h-3" /></span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Diário da Cunhagem (Figma Section) */}
      <div className="space-y-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground">Diário da Cunhagem</h2>
          <p className="text-[11px] text-foreground-muted mt-1">
            Histórias, guias e insights para colecionadores sobre o universo da propriedade digital.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              date: '12 de setembro  |  Leitura de 6 min',
              title: 'Como funciona a propriedade de NFTs',
              desc: 'Aprenda a colecionar, negociar e verificar ativos digitais.',
              image: '/nfts/figma/img6_9df2.avif',
            },
            {
              date: '13 de setembro  |  Leitura de 2 min',
              title: '10 artistas digitais para acompanhar',
              desc: 'Conheça criadores que moldam a cultura digital.',
              image: '/nfts/figma/img4_8459.avif',
            },
            {
              date: '15 de setembro  |  Leitura de 3 min',
              title: 'Raridade, atributos e procedência',
              desc: 'Entenda raridade, procedência, direitos autorais e utilidade.',
              image: '/nfts/figma/img1_2986.avif',
            },
            {
              date: '15 de setembro  |  Leitura de 2 min',
              title: 'Como proteger sua carteira',
              desc: 'Proteja sua carteira, seus ativos e sua identidade.',
              image: '/nfts/figma/img5_8758.avif',
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="rounded-lg bg-surface overflow-hidden transition-colors hover:bg-surface-hover group"
            >
              <div className="aspect-[1.4] overflow-hidden bg-surface-secondary">
                <img
                  src={item.image}
                  srcSet={getNFTImageSrcSet(item.image)}
                  sizes="(min-width: 1024px) 220px, (min-width: 640px) 45vw, 90vw"
                  alt={item.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-2 space-y-1.5">
              <span className="text-[9px] text-foreground-muted block font-mono">{item.date}</span>
              <h3 className="font-bold text-xs text-foreground group-hover:text-primary transition-colors">
                {item.title}
              </h3>
              <p className="text-[10px] text-foreground-muted leading-relaxed line-clamp-2">
                {item.desc}
              </p>
              <Link
                to="/docs"
                className="inline-flex items-center gap-1 text-[10px] text-primary font-bold pt-1 hover:underline"
              >
                <span>Ler mais</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
