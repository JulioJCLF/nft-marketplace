# Decisões técnicas

| Decisão | Contexto e motivo | Consequência / risco |
|---|---|---|
| Preservar a árvore atual e não criar outro checkout | Pedido explícito atual prevaleceu sobre a instrução antiga de Projeto 2; muitas alterações locais já existem | O repositório continua com trabalho não commitado; revisão cuidadosa antes de qualquer operação de Git |
| Carregar filtros e telas não iniciais sob demanda | Reduzir JavaScript inicial sem reescrever arquitetura | Carregamento deve manter layout e testes precisam acionar conteúdos deferred |
| Entregar AVIF responsivo com fallback para o original | Slots pequenos em mobile não precisam baixar imagem de 1254 px | Variantes são assets derivados; manter imagens PNG e AVIF fonte intactas |
| Capturar screenshot responsivo após percorrer a página | Playwright full-page não dispara IntersectionObserver/nativo lazy-load por si só | Helper simula rolagem e espera conteúdo; sem alterar tolerância pixel do baseline |
| Ligar o filtro por evento de janela nomeado | Navbar e CatalogGrid não compartilham estado React | Acoplamento simples por evento; controlar nome e ciclo de vida |
| Recuperar pedido pelo token idempotente após resposta perdida | Servidor pode confirmar e a resposta pode chegar como 504 | A tentativa é user-scoped; recibo da sessão fica em sessionStorage até fechar |
| Fazer timeout mockar uma resposta perdida após commit | Cenário anterior respondia 504 antes de criar pedido e não testava a condição real | Pedido confirmado remove quantidades do carrinho; o cliente deve reconciliar antes de tentar nova cobrança |
| Relatórios novos vão para uma pasta escolhida por env | `lighthouse-reports/` já contém mudanças locais | Variável `LIGHTHOUSE_REPORTS_DIR` evita sobrescrever a evidência existente |

Todas as decisões foram feitas no código do repositório existente; nenhum deploy/commit/push foi feito.
