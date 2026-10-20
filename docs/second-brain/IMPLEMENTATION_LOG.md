# Registro cronológico

## 2026-10-20 — revalidação adversarial final

- E2E: 84/84; visual: 25/25 em desktop, mobile e tablet, incluindo 1920×1080.
- Typecheck, lint, build e `git diff --check`: passaram.
- Lighthouse (medianas): Home mobile 92, Home desktop 100, detalhe mobile 94, detalhe desktop 100; A11y, Best Practices e SEO 100 em todos os perfis. Relatórios versionados em `lighthouse-reports/adversarial-recheck-2026-10-20/`.
- Fontes Figma e exports foram excluídos do repositório a pedido do usuário; permanecem apenas no workspace local.
- Commit local preparado. O push precisa de autenticação GitHub válida; nenhum deploy foi feito.

## 2026-10-20 — fechamento e entrega local

- Removido o fallback de barramento local: eventos de NFT e pedido chegam ao consumidor apenas pelo binding Socket.IO/MSW e `socket.io-client`. A inicialização do cliente acontece após o interceptor WebSocket do MSW.
- Corrigida a emissão de atualização de NFT para preservar campos ausentes e corrigida a captura do preço anterior quando o NFT estava apenas no cache do carrinho.
- Implementados pedidos pendentes com transição terminal confirmada/recusada via `order.updated`, isolamento por usuário, liberação de estoque em recusa e reconciliação após desconexão/reload.
- Corrigida a busca nos breakpoints mobile/tablet/desktop; adicionada cobertura de eventos duplicados e antigos.
- Ajustado o ornamento circular do hero mobile, adicionada prioridade de carregamento à imagem do hero e adicionado `robots.txt` válido.
- E2E da rodada: 69/69; posteriormente ampliado para 84/84. Regressão visual: 25/25.
- Typecheck, lint, build e `git diff --check` passaram. Build: 2140 módulos.
- Lighthouse da rodada anterior: Home mobile 89/100/100/100; Home desktop 99/100/100/100; NFT mobile 91/100/100/100; NFT desktop 99/100/100/100. Resultados supersedidos pela revalidação acima.

## 2026-10-20 — execução autônoma (rodada intermediária, substituída pelo fechamento abaixo)

- Revisada a especificação anexada, estrutura, `package.json`, branch `main`, diff e alterações locais; nenhum trabalho existente foi descartado.
- Confirmados typecheck, lint e build finais. Build final: 2140 módulos; JS inicial 472.67 KB bruto/148.30 KB gzip, CSS 55.03 KB.
- E2E inicial: 33/34; o filtro mobile falhou. Corrigida a abertura do drawer e corrigido o helper que detectava um `aside` errado.
- E2E após filtro: 34/34.
- Visual: 9/12; full-page snapshots não ativavam conteúdo lazy e faltava baselines tablet. Ajustada a rolagem do helper, adicionada cobertura 768 e inspecionadas quatro novas imagens.
- Visual: 12/12 após corrigir a preparação de telas que realmente adiam conteúdo.
- Adicionada recuperação idempotente após 504 e refresh; teste em 390px passou. Acrescentados labels ligados ao input e testes de cadastro duplicado/foco de teclado.
- Rodada intermediária: E2E 60/60 e regressão visual 16/16; catálogo 15/15. Resultado supersedido pelo fechamento final acima (69 E2E e 25 visuais).
- Lighthouse intermediário: home mobile 89, home desktop 98, detalhe mobile 91, detalhe desktop 99. Resultado supersedido pelas rodadas posteriores.
- `git diff --check` passou. Screenshots de implementação e evidência do filtro antes/depois estão em `VALIDATION.md`; referências originais do Figma ficam fora do Git.
- Comparação visual identificou gaps remanescentes de texto/dados, resumo de avaliação no detalhe mobile e altura total da home; fidelidade 1:1 ainda não atingida.

## Alterações anteriores no working tree

O diff já incluía mudanças de UI, mocks, reportes Lighthouse, testes e assets antes do ciclo de validação. Elas foram mantidas. Relatórios Lighthouse versionados foram gerados em `/tmp/kurio-lighthouse-full` com override de diretório para não sobrescrever reportes modificados preexistentes. Este log não atribui cada uma das alterações históricas à sessão atual.
