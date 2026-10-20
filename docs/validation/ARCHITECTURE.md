# Arquitetura observada

## Camadas

- `src/routes/router.tsx`: TanStack Router, rotas e layouts. Rotas secundárias, drawer/modal e seções abaixo da dobra usam imports lazy/deferred.
- `src/features/`: catálogo, detalhe, conta, carrinho e checkout.
- `src/lib/api.ts`: Axios em `/api`, token/scenario headers e reação global a 401.
- `src/mocks/`: `Mock Service Worker`, handlers REST, fixtures e banco local persistente; `socketBinding.ts` conecta o binding compatível com Socket.IO.
- `src/realtime/`: `socket.io-client`, subscriptions, filtros de versão e invalidação/reconciliação do cache.
- TanStack Query identifica recursos e invalida `cart`, `quote`, `orders`, `nfts`, `favorites`, `wallets` após alterações/eventos.
- `src/components/ui/`: camada shadcn/ui de componentes locais editáveis, adaptada aos tokens do projeto. `Button`, `Badge`, `Input`, `Dialog`, `Skeleton` e `Alert` são usados nas telas de catálogo, detalhe, autenticação, carrinho, checkout, perfil, documentação e barra de cenários; Radix fornece os primitivos quando necessário, CVA as variantes e `cn` a composição de classes. `components.json` configura o CLI shadcn para este projeto Vite/Tailwind 3. shadcn/ui distribui código-fonte e não precisa de pacote runtime.

## Dados e contratos observados

Endpoints estão em `src/mocks/handlers/`: sessão/conta, NFTs/favoritos, carrinho, cotação/cupom, pedidos, perfil/carteiras e sistema. Os contratos TypeScript ficam em `src/types/index.ts`. Todas as chamadas de produto passam pelo Axios; handlers MSW compõem o estado em `src/mocks/db.ts`.

Pedido contém `idempotencyKey`, itens, carteira, rede, cupom, cotação aceita e snapshot de valores. O mock mantém ledger por chave e rejeita conteúdo diferente com conflito. O cenário de timeout agora comita antes de retornar 504; `GET /api/orders/by-idempotency/:key` reconcilia a tentativa do mesmo usuário.

## Eventos em tempo real

- `nft.updated`: atualiza consultas de NFTs/carrinho e alerta o usuário quando uma cotação fica desatualizada.
- `order.updated`: invalida consultas do pedido/lista de pedidos e produz feedback.
- Eventos carregam IDs/versão; `RealtimeContext.tsx` descarta duplicatas e versões anteriores. Os E2E ainda não cobrem todos os eventos, versões ou reconexões.

## Sessão e carrinho

Token fictício em `localStorage`; o interceptor Axios envia Bearer e cenário. AuthProvider remove caches privados em logout/troca. Carrinho remoto é particionado por usuário; carrinho convidado é mesclado ao autenticar. Valores passam por Decimal.js e APIs usam strings ETH.

## Performance

`getNFTImageSrcSet` monta escolhas AVIF 320/384/768/original. `index.html` define preload por rota e largura; filtros, modais, footer, conteúdo editorial e rotas secundárias são carregados sob demanda. O preload e a fonte externa ainda dependem do caminho de execução do browser.
