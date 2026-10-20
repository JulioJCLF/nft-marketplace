# Rastreabilidade do desafio

Fonte: [`SPECIFICATION.md`](SPECIFICATION.md). “Validado” exige evidência executada nesta sessão; “Parcial” indica código ou cobertura incompleta. Contagem do resumo considera cada linha como uma unidade de requisito.

| ID | Requisito verificável | Estado | Evidência atual | Próxima ação |
|---|---|---|---|---|
| S01 | React + TypeScript e stack principal (Router, Query, Axios, Tailwind, MSW, Socket.IO) | Parcial | Dependências, imports e build; `package.json`, `src/app/App.tsx` | Confirmar shadcn/ui explicitamente e documentar seu uso local |
| S02 | Rotas de início, detalhe, carrinho, checkout, perfil e docs com acesso direto | Parcial | rotas em `src/routes/router.tsx`; visual tests em quatro fluxos | Cobrir refresh de todas as rotas privadas |
| S03 | Busca sincronizada com URL | Validado | E2E desktop/mobile/tablet: `01-catalog-and-search.spec.ts` | — |
| S04 | Combinação de filtros, parâmetros API e reset da página | Parcial | filtros/categoria testados; faixa e status não combinados em E2E | Cobrir combinação e refresh |
| S05 | Ordenação, paginação e histórico do browser | Validado | E2E `01-catalog-and-search.spec.ts` nos três viewports | — |
| S06 | Vazio, erro e resposta lenta/fora de ordem no catálogo | Parcial | vazio validado; handlers têm cenários, sem teste de retry/ordem | Adicionar E2E de falha, latência e resposta obsoleta |
| S07 | Detalhe direto, metadados e NFT inexistente (404) | Validado | E2E `02-nft-details-and-404.spec.ts` | — |
| S08 | Edição indisponível e limite de quantidade | Parcial | controles e estoque no componente/DB | Testar edição esgotada e limites |
| S09 | Favoritos autenticados, persistência e rollback | Validado | E2E `04-favorites-optimistic.spec.ts` | — |
| S10 | Carrinho: quantidade, remoção, cupom, taxas e totais | Parcial | fluxo de cupom/checkout; `CartContext.tsx` e mocks | Testar alteração de quantidade, remoção e cupom inválido |
| S11 | Carrinho persistente e merge do carrinho visitante | Parcial | lógica em `CartContext.tsx`/`handlers/auth.ts` | Cobrir refresh e merge em E2E |
| S12 | Precisão decimal em ETH e quantidade inteira | Parcial | Decimal.js, helpers em `src/lib/eth.ts`, tipos | Adicionar asserções com decimais difíceis |
| S13 | Checkout revalida cotação/preço/disponibilidade antes da compra | Parcial | evento `nft.updated` bloqueia checkout, E2E `06-realtime-and-wallets.spec.ts` | Cobrir reconfirmação após alteração de preço/estoque |
| S14 | Compra confirmada, recibo imutável e snapshot | Validado | E2E fluxo completo em `05-cart-and-checkout.spec.ts` | — |
| S15 | Pagamento recusado preserva carrinho | Validado | E2E `05-cart-and-checkout.spec.ts` | — |
| S16 | Pedido idempotente e recuperação após resposta 504/refresh | Validado | Novo E2E `order_timeout`, endpoint GET por chave e sessão | Testar chave reutilizada com payload diferente (409) |
| S17 | Pedido pendente/recuperação após reconexão | Validado | E2E cria pedido pendente, derruba Socket.IO, confirma no mock e recupera o recibo após reload; também cobre recusa terminal | — |
| S18 | Login, sessão persistente, logout e troca de usuário | Validado | E2E `03-auth-and-session.spec.ts` | — |
| S19 | Cadastro, validação e conflito de e-mail | Validado | Novo E2E de cadastro e duplicidade | Cobrir senha fraca e erro 4xx |
| S20 | Expiração de sessão durante navegação/checkout | Parcial | interceptor 401 e handler MSW | Exercitar cenário 401 no E2E e verificar retomada |
| S21 | Perfil, avatar e edição persistente | Parcial | E2E salva perfil e upload; `handlers/profile.ts` | Cobrir refresh, alteração de senha e validação de campo |
| S22 | Carteiras, edição, principal e redes | Parcial | E2E cria carteira e escolhe principal | Cobrir dropdown de rede, edição, remoção e refresh |
| S23 | REST e MSW usam estado compartilhado e reset reproduzível | Parcial | `src/mocks/db.ts`, `handlers/index.ts`, reset utilizado nos E2E | Provar persistência e reset em testes dedicados |
| S24 | Pelo menos dois usuários e dados de demonstração | Validado | Fixtures Alice/Bob em `src/mocks/fixtures.ts`; troca testada | — |
| S25 | Falhas HTTP, timeout, rede lenta, cupom e conflito configuráveis | Parcial | cenários em `ScenarioBar.tsx`/handlers | Cobrir cada cenário da lista do desafio em E2E |
| S26 | Eventos Socket.IO `nft.updated` e `order.updated` | Validado | E2E recebe ambos pelo `socket.io-client`; `order.updated` confirma/recusa e altera o recibo | — |
| S27 | Duplicatas, versões antigas, reconciliação e isolamento de sessão no socket | Validado | E2E reproduz evento duplicado e versão anterior, valida identidade do usuário e recupera pedido após desconexão/reload | — |
| S28 | Skeleton shimmer preserva geometria e reduz movimento | Parcial | `src/components/ui/Skeleton.tsx`; sem cenários visuais lentos | Validar shimmer/loading lento e prefers-reduced-motion |
| S29 | Labels, erros associados, teclado e foco em diálogo | Parcial | labels auth corrigidos; teste de foco do Dialog | Ampliar a todos formulários e drawer; axe/contraste |
| S30 | Tela mobile 390px | Validado | E2E em todos os fluxos; snapshots de início, detalhe, carrinho, checkout, perfil, carteiras e recibo | — |
| S31 | Tela tablet 768px | Validado | E2E e snapshots visuais nas mesmas sete telas | — |
| S32 | Tela 1440px e desktop Full HD 1920×1080 | Validado | E2E desktop 1440; screenshots visuais 1440 nas quatro telas principais e 1920 nas sete telas | — |
| S33 | Regressão visual de início, detalhe, carrinho e pagamento | Validado | 25 snapshots Playwright em 390, 768, 1440 e 1920; inclui telas de conta e recibo | Baselines verificam regressão, não equivalência pixel a pixel com Figma |
| S34 | Aderência visual 1:1 ao Figma em todas as páginas | Parcial | exports PNG locais comparados visualmente; sem arquivo Figma online/node MCP | Ajustar divergências por tela e validar comparação pareada |
| S35 | Lighthouse: 3 execuções/página em mobile e desktop + HTML/JSON | Validado | Três medições por combinação, medianas acima da meta nas quatro combinações; relatórios em `lighthouse-reports/adversarial-recheck-2026-10-20/` | — |
| S36 | Setup, contratos, cenários, limites e instruções reproduzíveis | Parcial | `README.md`, `/docs`; esta base adiciona rastreabilidade | Conciliar URLs públicas divergentes e detalhar todos os contratos |
| S37 | Build a partir do checkout atual | Validado | `npm run build` passou nesta execução | Testar clone limpo sem sobrescrever o checkout atual |
| S38 | Deploy publicado, rotas e mocks validados | Não verificado | README e UI citam URLs diferentes | Verificar URL existente; deploy não foi executado |

**Cobertura estritamente marcada como validada nesta matriz: 19/38 (50%).** Parcial e não verificado não contam como concluídos. O deploy permanece “não verificado”; a pontuação de avaliação continua estimada, não garantida.
