# Deploy

## Estado verificado

- O README declara `https://nft-marketplace-6b1.pages.dev`; configuração: `npm run build` → `dist`, SPA via `public/_redirects`.
- O link do painel do ScenarioBar usa o mesmo hostname.
- `https://nft-marketplace-6b1.pages.dev` respondeu HTTP 200; as rotas `/`, `/nft/bored-ape-7090`, `/checkout`, `/profile?tab=wallets` e `/docs` carregaram com título esperado e sem erro JS de página.
- A demonstração respondeu, mas está desatualizada em relação ao checkout local.
- O commit local está preparado. O push depende de reautenticar o GitHub; nenhum deploy foi feito.

## Próximos passos

1. Reautenticar o GitHub e enviar a branch `main` para `JulioJCLF/nft-marketplace`.
2. Publicar o checkout atualizado no Cloudflare Pages.
3. Validar acesso direto e refresh em `/nft/...`, `/checkout`, `/profile` e `/docs`.

Não inclua tokens, senhas ou secrets neste documento.
