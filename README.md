# NFT Marketplace — React + TypeScript + Cloudflare Pages

> Aplicação completa de **NFT Marketplace** desenvolvida com alta fidelidade ao design do Figma, seguindo rigorosamente todos os critérios técnicos, contratos de transporte, simulação de APIs via MSW, eventos em tempo real com Socket.IO e infraestrutura estática para o Cloudflare Pages.

---

## 🔗 Links Oficiais

- **Repositório GitHub:** `https://github.com/JulioJCLF/nft-marketplace`
- **Marketplace (Cloudflare Pages):** `https://nft-marketplace-challenge.pages.dev`
- **Documentação Pública Hospedada:** `https://nft-marketplace-challenge.pages.dev/docs`

---

## 🚀 Funcionalidades Principais

- **Catálogo Inteligente:**
  - Busca textual com debounce e sincronização em tempo real na URL.
  - Filtros combináveis: Categorias, Faixas de Preço Min/Max (ETH) e Disponibilidade (Disponíveis/Esgotados).
  - Ordenação por Menor Preço, Maior Preço, Recentes e Populares.
  - Paginação fluida com reinício automático ao mudar filtros e histórico preservado.
- **Detalhes da Obra & 404:**
  - Galeria de imagens com miniaturas e zoom interativo.
  - Exibição de propriedades (traits) com cálculo de raridade percentual.
  - Histórico de transações com hashes blockchain simulados.
  - Tratamento resiliente de NFT inexistente (404) com botão de retorno.
- **Favoritos com Atualização Otimista Real:**
  - Alternância imediata do coração e contador na interface.
  - Persistência associada à identidade do usuário autenticado.
  - Rollback automático para o estado anterior caso a API simule erro 500.
- **Carrinho & Precisão Financeira:**
  - Adição, controle de quantidade inteira e limites de estoque.
  - Validação e aplicação de cupons promocionais (`DESC10`, `ETH5`, `VIP20`).
  - Totalizadores processados via **Decimal.js** (eliminação completa de erros de ponto flutuante em ETH).
- **Checkout, Idempotência & Pagamento:**
  - Rota protegida `/checkout` com retorno inteligente após login.
  - Seleção de provedores (MetaMask, Coinbase, Rainbow, WalletConnect) e redes (Mainnet, Sepolia, Arbitrum, Polygon).
  - Bloqueio de checkout com cotação desatualizada quando preços mudam em tempo real.
  - Chave de idempotência única por pedido (prevenção de cobrança dupla; erro 409 em divergência).
  - Preservação do carrinho em caso de recusa de pagamento (402).
  - Recibo imutável contendo hash da transação, data e snapshot de valores.
- **Sessão, Perfil & Carteiras:**
  - Login, cadastro e logout com persistência de token JWT simulado no reload.
  - Isolamento estrito de cache entre usuários (sem vazamento de dados).
  - Cadastro de carteiras públicas com validação de formato `0x`, escolha de carteira principal e alteração de senha.
- **Tempo Real com Socket.IO:**
  - Eventos `nft.updated` e `order.updated` com identidade estável e versão.
  - Monotonia de versão (descarte de eventos obsoletos ou duplicados).
  - Reconciliação automática com as APIs REST após reconexão.
- **Simulador de Cenários & Reset:**
  - Barra superior interativa para acionar cenários determinísticos (500 Error, 401 Expired, Rede Lenta, Falha de Pagamento) e disparar eventos de tempo real.
  - Botão de Reset que restaura o banco simulado ao estado inicial em 1 clique.

---

## 🛠️ Stack Tecnológica

| Tecnologia | Finalidade |
|---|---|
| **React 18** | Biblioteca base para renderização de componentes |
| **TypeScript** | Tipagem estrita de contratos de domínio, transporte e UI |
| **Vite 6** | Build tool ultrarrápido com chunk splitting customizado |
| **TanStack Router** | Roteamento declarativo com search params tipados na URL |
| **TanStack Query v5** | Gestão de cache remoto, mutações e atualizações otimistas |
| **Axios** | Cliente HTTP com interceptors de autenticação e cenários |
| **Tailwind CSS** | Estilização utilitária com paleta fiel extraída do Figma |
| **shadcn/ui & Radix UI** | Primitivos acessíveis com controle de foco e teclado |
| **Decimal.js** | Biblioteca de precisão decimal de 28 dígitos para cálculos em ETH |
| **MSW 2 (Mock Service Worker)** | Interceptação de requisições REST e WebSocket no Service Worker |
| **Socket.IO Client** | Cliente do protocolo em tempo real |
| **@mswjs/socket.io-binding** | Binding para suporte ao protocolo Socket.IO no MSW |
| **Playwright** | Suíte de testes E2E e testes de regressão visual |
| **Lighthouse** | Auditoria automatizada de Performance, A11y, Best Practices e SEO |

---

## 👥 Contas de Teste Pré-configuradas

| Nome | E-mail | Senha | Carteira Principal | Saldo Inicial |
|---|---|---|---|---|
| **Alice Vance** | `alice@example.com` | `Password123!` | `0x71C...392A` (MetaMask) | `124.5000 ETH` |
| **Bob Martin** | `bob@example.com` | `Password123!` | `0x33A...91D2` (MetaMask) | `80.0000 ETH` |

> Também é possível cadastrar novas contas ou usar o preenchimento automático em 1 clique no modal de autenticação.

---

## 💻 Instalação & Execução Local

```bash
# 1. Clonar o repositório
git clone https://github.com/JulioJCLF/nft-marketplace.git
cd nft-marketplace

# 2. Instalar dependências
npm install

# 3. Iniciar servidor de desenvolvimento (porta 3000)
npm run dev

# 4. Compilar para produção e visualizar preview
npm run build
npm run preview
```

---

## ⚙️ Variáveis de Ambiente

Crie um arquivo `.env` caso deseje sobrescrever as configurações:

```ini
# Habilita o Mock Service Worker (padrão: true)
VITE_ENABLE_MOCKS=true
```

---

## 🧪 Testes Automatizados & Qualidade

```bash
# Executar todos os testes E2E do Playwright
npx playwright test

# Executar testes em modo interativo com UI
npm run test:e2e:ui

# Executar testes de regressão visual com snapshots
npm run test:visual

# Executar medições e auditoria Lighthouse
npm run lighthouse
```

---

## ☁️ Publicação no Cloudflare Pages

O projeto foi configurado com suporte nativo a builds estáticos do Vite:
- **Build command:** `npm run build`
- **Output directory:** `dist`
- **Branch:** `main`
- **Roteamento SPA:** Garantido pelo arquivo `public/_redirects` (`/* /index.html 200`), permitindo recarregar rotas diretas como `/docs`, `/checkout` e `/profile` sem erros 404.
