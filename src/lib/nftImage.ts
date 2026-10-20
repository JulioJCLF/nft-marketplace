const NFT_IMAGE_PREFIX = '/nfts/figma/'

export function getNFTImageSrcSet(src: string): string | undefined {
  if (!src.startsWith(NFT_IMAGE_PREFIX) || !src.endsWith('.avif')) return undefined

  const base = src.slice(0, -'.avif'.length)
  return `${base}-320.avif 320w, ${base}-384.avif 384w, ${base}-768.avif 768w, ${src} 1254w`
}
