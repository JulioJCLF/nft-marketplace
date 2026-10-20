# Backlog recuperado da conversa

Status avaliado pelo código atual e pelas validações da sessão; “presente” não significa que todos os estados estejam cobertos por testes.

| ID | Pedido adicional | Estado observado | Evidência / pendência |
|---|---|---|---|
| C01 | Fidelidade do detalhe NFT; avaliação de colecionadores junto ao histórico | Presente | aba `Avaliações de colecionadores` em `NFTDetailsPage.tsx`; conteúdo vazio ainda é simples |
| C02 | Favorito ao lado de comprar; remover preço riscado em todo lugar; edição extra | Presente | controles de compra e edições no detalhe; procurar strike-through em toda a UI antes de encerrar |
| C03 | Compartilhar NFT com logos | Presente | botões/ícones de share no detalhe |
| C04 | Carrinho drawer e página completa mais fiéis; thumbnail alinhada na linha | Presente | `CartDrawer.tsx`, `CartPage.tsx`; snapshots E2E/visuais |
| C05 | Checkout conforme mock, campos adicionais, sem emojis e rede em dropdown com quatro opções | Presente | `CheckoutPage.tsx`, seletor Mainnet/Sepolia/Arbitrum/Polygon; teste seleciona Polygon |
| C06 | Login e cadastro com Google/Facebook | Visual presente | botões nos dois modos; OAuth real não está no escopo nem conectado |
| C07 | Perfil fiel, avatar por último e upload de arquivo | Parcial | upload coberto; comparar todos os campos com o frame e validar persistência |
| C08 | Carteira com seletor de rede, ENS, referral, dois campos ENS e sem saldo estimado | Presente | `ProfilePage.tsx` + mock profile; rede precisa de teste E2E |
| C09 | Navbar inferior mobile: só ícones, carrinho, botão central flutuante/curva/espaço e gradiente só na bola | Presente no código | `MobileBottomNav.tsx`; ainda precisa comparação pareada com frame mobile |
| C10 | Aba Novos lançamentos clicável e tipografia um pouco maior | Presente | estado local de aba em `CatalogGrid.tsx`; adicionar teste específico de clique |
| C11 | Botão conectar com mesmo arredondamento do padrão | Presente | `Navbar.tsx` |
| C12 | Confirmação de pedido fiel; melhorar ícone thank-you; remover imprimir | Presente | receipt em `CheckoutPage.tsx`; SVG local; sem botão de imprimir |
| C13 | Header fiel e estado ativo para Início/Mercado/Aprenda | Presente | `Navbar.tsx`; comparar com export desktop |
| C14 | Filtro fiel; faixa dinâmica ao maior preço disponível | Presente | `FiltersSidebar.tsx`, `CatalogGrid.tsx`; E2E testa categoria, faltam preço/status combinados |
| C15 | Descolar seta do dropdown de ordenação | Presente | layout e ícone em `CatalogGrid.tsx` |
| C16 | Respiro entre coleção e rodapé no detalhe | Presente | espaçamentos do fim da página em `NFTDetailsPage.tsx` |
| C17 | Testes mobile, desktop e 1080p | Feito nesta sessão | suites E2E e visuais agora incluem 390, 768, 1440 e 1920×1080 |
| C18 | Converter imagens para AVIF e melhorar velocidade | Feito no workspace | variantes AVIF responsivas e helper `src/lib/nftImage.ts`; Lighthouse final abaixo |
| C19 | Filtro mobile precisa abrir; clique deve funcionar | Corrigido nesta sessão | evento explícito no Navbar/CatalogGrid; regressão E2E mobile e tablet |
| C20 | Recuperar pedido após timeout e refresh sem cobrar novamente | Corrigido nesta sessão | chave idempotente, lookup autenticado, persistência do recibo e E2E de 504 |

## Pedidos sem autorização ou fora do escopo

- Nenhum deploy, commit, push ou publicação foi executado. O orquestrador não concedeu credenciais externas; URLs declaradas no README e na UI ainda precisam de verificação.
