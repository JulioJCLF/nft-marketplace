# Deploy

## Estado verificado

- O README e o painel do `ScenarioBar` apontam para `https://nft-marketplace-6b1.pages.dev`; configuração: `npm run build` → `dist`, SPA via `public/_redirects`.
- O checkout atualizado foi publicado no Cloudflare Pages (`wrangler pages deploy dist --project-name nft-marketplace --branch main`, deploy `https://c38f5e84.nft-marketplace-6b1.pages.dev`).
- `https://nft-marketplace-6b1.pages.dev` respondeu HTTP 200 nas rotas `/`, `/nft/bored-ape-7090`, `/checkout`, `/profile`, `/docs` e `/mockServiceWorker.js`, servindo o bundle atualizado.

Não inclua tokens, senhas ou secrets neste documento.
