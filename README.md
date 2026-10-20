# Kurio — NFT Marketplace

Marketplace de NFTs desenvolvido em React e TypeScript. Inclui catálogo, detalhe do NFT, favoritos, carrinho, checkout simulado, perfil e carteiras. MSW fornece os dados e as APIs locais; não há pagamentos reais nem transações on-chain.

## Começar

Requisitos: Node.js 20+ e npm.

```bash
git clone https://github.com/JulioJCLF/nft-marketplace.git
cd nft-marketplace
npm install
npm run dev:mocks
```

Abra `http://localhost:3000`. O comando inicia o Vite com os mocks habilitados.

## Comandos

| Comando | Uso |
|---|---|
| `npm run build` | Verifica TypeScript e gera `dist/` |
| `npm run typecheck` | Verifica tipos |
| `npm run lint` | Executa ESLint |
| `npm test` | Testes E2E Playwright |
| `npm run test:visual` | Testes de regressão visual |
| `npm run lighthouse` | Auditoria Lighthouse |

## Rotas

- `/` — catálogo, busca, filtros e ordenação
- `/nft/:id` — detalhes, histórico e avaliações
- `/cart` e `/checkout` — carrinho e pedido simulado
- `/profile` — perfil, favoritos e carteiras
- `/docs` — documentação técnica da aplicação

## Dados de demonstração

| Usuário | E-mail | Senha |
|---|---|---|
| Alice Vance | `alice@example.com` | `Password123!` |
| Bob Martin | `bob@example.com` | `Password123!` |

Use o **Simulador de Cenários MSW** na aplicação para testar falhas HTTP, pagamento recusado ou pendente, latência e eventos Socket.IO. A opção **Resetar** restaura os dados simulados no navegador.

## Tecnologias

React, TypeScript, Vite, TanStack Router/Query, Axios, Tailwind CSS, shadcn/ui (componentes locais sobre Radix UI), Decimal.js, MSW, Socket.IO, Playwright e Lighthouse.

## Validação e publicação

Os detalhes dos testes, resultados Lighthouse e limitações conhecidas estão em [`docs/validation/VALIDATION.md`](docs/validation/VALIDATION.md). A configuração do Cloudflare Pages está em [`docs/validation/DEPLOYMENT.md`](docs/validation/DEPLOYMENT.md).

- Build: `npm run build`
- Diretório de saída: `dist`
- Fallback SPA: `public/_redirects`

A [demonstração pública](https://nft-marketplace-6b1.pages.dev) está publicada no Cloudflare Pages com suporte a acesso direto nas rotas SPA e mocks MSW ativos.
