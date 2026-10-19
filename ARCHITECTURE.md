# Arquitetura do Sistema — NFT Marketplace

## 1. Visão Geral & Filosofia de Design

O projeto implementa uma aplicação de NFT Marketplace orientada a contratos, com forte isolamento de responsabilidades, previsibilidade de estado e fidelidade visual aos frames do Figma.

A arquitetura foi concebida para operar como uma **Single Page Application (SPA)** moderna, estática e de alta performance, capaz de ser hospedada no **Cloudflare Pages** sem requisições a backends privados, utilizando o **Mock Service Worker (MSW)** e o protocolo **Socket.IO** de forma transparente tanto no ambiente local quanto na demonstração pública publicada.

```
+-----------------------------------------------------------------------------------+
|                                 CAMADA DE APRESENTAÇÃO                            |
|  +-----------------------------------------------------------------------------+  |
|  |           TanStack Router (Rotas estáticas + Search Params Tipados)          |  |
|  +-----------------------------------------------------------------------------+  |
|        |                               |                              |           |
|  [Catálogo / Hero]           [Detalhes da Obra]              [Carrinho / Checkout]|
|        |                               |                              |           |
|        +-------------------------------+------------------------------+           |
|                                        |                                          |
|                       TanStack Query (Queries & Mutações)                         |
+----------------------------------------|------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                                CAMADA DE TRANSPORTE                               |
|                     Axios Client (Interceptors, Auth, Abort)                      |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                         CAMADA DE SIMULAÇÃO & TEMPO REAL                          |
|  +-----------------------------------------------------------------------------+  |
|  |              MSW 2 (Mock Service Worker — Browser Service Worker)           |  |
|  |       [Auth] [NFTs] [Favoritos] [Carrinho] [Cotação] [Pedidos] [Carteiras]  |  |
|  +-----------------------------------------------------------------------------+  |
|                                        |                                          |
|          +-----------------------------+-----------------------------+            |
|          |                                                           |            |
|          v                                                           v            |
|  [Mock Database em Memória + localStorage]        [Socket.IO Binding & WebSocket] |
|  - Idempotência de Pedidos                        - Eventos nft.updated           |
|  - 12 NFTs Ricos e Variados                       - Eventos order.updated         |
|  - Isolamento Alice / Bob                         - Monotonia de Versão           |
+-----------------------------------------------------------------------------------+
```

---

## 2. Estrutura de Diretórios e Domínios

```
src/
├── app/               # Configuração global, Provedores React e QueryClient
├── routes/            # Roteador TanStack Router e definição de rotas estáticas
├── features/          # Módulos verticais de domínio
│   ├── catalog/       # Catálogo, Hero, Filtros, Busca, Cards e Detalhes
│   ├── cart/          # Carrinho de compras, Drawer, Cupons e Totalizadores
│   ├── checkout/      # Seleção de carteira/rede, idempotência e pagamento
│   ├── orders/        # Recibo imutável e histórico de compras confirmadas
│   ├── auth/          # Modal de Login/Cadastro, JWT simulado e sessão
│   └── profile/       # Gestão de perfil, avatar, senha e carteiras
├── components/        # Componentes compartilhados
│   ├── ui/            # Primitivos shadcn/ui customizados (Button, Input, Dialog, etc.)
│   └── layout/        # Navbar, Footer e Simulador de Cenários MSW
├── lib/               # Clientes e utilitários
│   ├── api.ts         # Instância Axios com interceptors de token e cenários
│   ├── eth.ts         # Funções financeiras de alta precisão via Decimal.js
│   └── utils.ts       # Utilitários de classes CSS (cn) e formatadores
├── mocks/             # Mock Service Worker e estado simulado
│   ├── db.ts          # Banco de dados persistente com idempotência
│   ├── fixtures.ts    # 12 NFTs variados, 2 usuários de teste e cupons
│   ├── browser.ts     # Inicializador do worker no navegador
│   ├── socketBinding.ts # Binding Socket.IO e WebSocket nativo
│   └── handlers/      # Handlers REST divididos por recurso
├── realtime/          # Integração Socket.IO no cliente
│   ├── socket.ts      # Instância socket.io-client
│   └── RealtimeContext.tsx # Contexto, monotonia de versão e reconciliação
├── docs/              # Portal de documentação técnica pública (/docs)
└── types/             # Tipagens TypeScript estritas do domínio
```

---

## 3. Gestão de Estado e Comunicação REST

### 3.1. TanStack Router & URLs Profundas
A navegação e o estado de filtros do catálogo são rigorosamente administrados pelo **TanStack Router**:
- Parâmetros `search`, `category`, `minPrice`, `maxPrice`, `status`, `sort` e `page` são sincronizados bidirecionalmente com a URL.
- Ao alterar qualquer critério de filtro ou ordenação, a paginação é automaticamente reiniciada para a página `1`.
- A navegação sobrevive a refresh de página, compartilhamento de link e botões de voltar/avançar no histórico.

### 3.2. TanStack Query & Políticas de Cache
O **TanStack Query** gerencia o estado remoto de forma determinística:
- `staleTime`: 30 segundos para listagens de catálogo e carrinho.
- `retry`: interceptador customizado que **não** tenta novas requisições para erros de negócio e autenticação (401, 404, 409), reduzindo chamadas inúteis.
- **Isolamento de Cache por Usuário**: Queries privadas (carrinho, carteiras, favoritos, perfil, pedidos) incluem o `userId` ou são limpas imediatamente através de `clearPrivateCache()` ao efetuar logout ou trocar de usuário fictício.

### 3.3. Atualização Otimista com Rollback Real
Implementada no recurso de **Favoritos** (`POST /api/favorites/:id`):
1. Ao clicar no botão de coração, a mutação cancela queries ativas e salva um snapshot do estado anterior.
2. O contador de likes e o status `isLiked` são atualizados instantaneamente na interface.
3. Se a requisição à API falhar (como no cenário simulado `favorite_fail`), a função `onError` restaura o snapshot salvo anteriormente e reverte a contagem, alertando o usuário.

---

## 4. Precisão Financeira em ETH (Decimal.js)

Operações financeiras com frações de Ethereum (ex: `0.0045 ETH` de gás somado a `45.5000 ETH`) não utilizam operações aritméticas nativas do JavaScript (ponto flutuante binário), pois geram imprecisões inaceitáveis em auditorias técnicas.

Todas as operações de cálculo financeiro são centralizadas em `src/lib/eth.ts` utilizando **Decimal.js**:
- `addEth(a, b)`: soma exata.
- `subEth(a, b)`: subtração com piso zero.
- `mulEth(price, quantity)`: multiplicação com truncamento de quantidade inteira.
- `calcDiscountPercent(subtotal, percent)`: desconto percentual rigoroso.
- `calcOrderTotal(subtotal, discount, gasFee)`: consolidação da cotação.

---

## 5. Idempotência e Confirmação de Pedidos

A criação de pedidos segue padrão de alta confiabilidade:
1. **Chave de Idempotência**: Cada intenção de compra gera uma chave estável `idempotencyKey` única.
2. **Replay Idempotente**: Se o usuário submeter o pedido múltiplas vezes (cliques repetidos ou falha intermitente na resposta), o backend simulado detecta a mesma chave e retorna o mesmo pedido (Status 200/201).
3. **Detecção de Conflito (409)**: Se a mesma chave for reutilizada com parâmetros divergentes (ex: itens diferentes), o sistema retorna `HTTP 409 Conflict`.
4. **Snapshot Imutável**: O recibo gerado memoriza os títulos, imagens, preços e taxas no momento da compra. Alterações posteriores no catálogo não afetam o recibo.
5. **Preservação de Carrinho**: Em caso de falha de pagamento (HTTP 402), os itens permanecem intocados no carrinho do usuário. O esvaziamento só ocorre após resposta 201/200 confirmada.

---

## 6. Tempo Real, Socket.IO & Monotonia de Versão

### 6.1. Protocolo e Binding
A integração utiliza `socket.io-client` conectando-se via WebSocket interceptado pelo `@mswjs/socket.io-binding`.

### 6.2. Monotonia de Versão e Deduplicação
Para evitar regressões causadas por latência variável ou entrega fora de ordem:
- Cada evento transporta `id`, `version`, `nftId` e timestamp.
- O cliente mantém um registro `processedEventIdsRef: Set<string>` e um mapa `entityVersionsRef: Map<string, number>`.
- Se um evento recebido tiver versão `<= versao_atual`, ele é sumariamente descartado.

### 6.3. Bloqueio de Cotação no Checkout (Cenário Obrigatório)
Se um NFT estiver no carrinho e seu preço for alterado via Socket.IO:
1. O cliente recebe o evento `nft.updated`.
2. A interface do Checkout detecta a divergência e ativa o banner de aviso em tempo real.
3. O botão de confirmação do pagamento é imediatamente desabilitado.
4. O usuário deve revisar a nova cotação e clicar em "Revisar e Aceitar Nova Cotação" para desbloquear a compra.

---

## 7. Responsividade e Acessibilidade (WCAG)

- **Viewports Validados**: 390px (Mobile), 768px (Tablet), 1440px (Desktop).
- **Sem Overflow Horizontal**: Conteúdo fluido com `min-w-0` e truncamento seguro.
- **Skeletons Shimmer**: Esqueletos com dimensões idênticas aos cards reais, respeitando `prefers-reduced-motion`.
- **Foco e Teclado**: Ordem lógica de tabulação, anéis de foco visíveis (`ring-2 ring-primary`) e gestão de foco em diálogos (`role="dialog"` e `aria-modal="true"`).
