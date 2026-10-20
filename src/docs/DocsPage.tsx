import React, { useState } from 'react'
import {
  BookOpen,
  Terminal,
  Layers,
  Server,
  Lock,
  ShoppingCart,
  Radio,
  Sliders,
  CheckCircle2,
  Cloud,
  AlertTriangle,
  Menu,
  X,
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'

const DOC_SECTIONS = [
  { id: 'visao-geral', title: '1. Visão Geral', icon: BookOpen },
  { id: 'instalacao', title: '2. Instalação & Setup', icon: Terminal },
  { id: 'arquitetura', title: '3. Arquitetura do Sistema', icon: Layers },
  { id: 'apis', title: '4. APIs Simuladas (MSW)', icon: Server },
  { id: 'autenticacao', title: '5. Autenticação & Sessão', icon: Lock },
  { id: 'carrinho', title: '6. Carrinho, Cotação & Pedidos', icon: ShoppingCart },
  { id: 'tempo-real', title: '7. Socket.IO & Tempo Real', icon: Radio },
  { id: 'cenarios', title: '8. Cenários de Demonstração', icon: Sliders },
  { id: 'testes', title: '9. Testes E2E & Qualidade', icon: CheckCircle2 },
  { id: 'deploy', title: '10. Publicação Cloudflare Pages', icon: Cloud },
  { id: 'limitacoes', title: '11. Limitações Conhecidas', icon: AlertTriangle },
]

export const DocsPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState('visao-geral')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const scrollTo = (id: string) => {
    setActiveSection(id)
    setMobileMenuOpen(false)
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Page Header */}
      <div className="border-b border-border pb-8 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Badge className="gap-1.5 px-3 py-1 rounded-full bg-primary/10 border-primary/30 text-primary text-xs font-semibold mb-3">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Documentação Técnica Oficial</span>
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
            NFT Marketplace — Guia de Arquitetura & Implementação
          </h1>
          <p className="text-sm text-foreground-muted mt-2 max-w-3xl leading-relaxed">
            Documentação abrangente sobre a implementação do desafio técnico frontend com React, TypeScript, TanStack Router/Query, MSW e deploy estático no Cloudflare Pages.
          </p>
        </div>

        {/* Mobile menu trigger */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden self-start flex items-center gap-2 px-3 py-2 rounded-lg border-border bg-surface text-xs font-bold text-foreground"
        >
          {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          <span>Índice da Documentação</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Navigation Sidebar */}
        <aside
          className={`lg:col-span-3 sticky top-28 space-y-1 ${
            mobileMenuOpen
              ? 'fixed inset-x-4 top-24 z-50 p-4 rounded-xl border border-border bg-surface shadow-2xl max-h-[80vh] overflow-y-auto block'
              : 'hidden lg:block'
          }`}
        >
          <div className="text-xs font-bold uppercase tracking-wider text-foreground-muted px-3 py-2 mb-1">
            Seções do Guia
          </div>
          {DOC_SECTIONS.map((sec) => {
            const Icon = sec.icon
            const isCurrent = activeSection === sec.id
            return (
              <button
                key={sec.id}
                onClick={() => scrollTo(sec.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold text-left transition-all ${
                  isCurrent
                    ? 'bg-primary text-primary-foreground font-bold shadow-sm'
                    : 'text-foreground-muted hover:text-foreground hover:bg-surface-secondary'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{sec.title}</span>
              </button>
            )
          })}
        </aside>

        {/* Main Content Area */}
        <main className="lg:col-span-9 space-y-16 text-foreground-muted text-sm leading-relaxed min-w-0">
          {/* Section 1: Visão Geral */}
          <section id="visao-geral" className="space-y-4 pt-2">
            <h2 className="text-2xl font-extrabold text-foreground tracking-tight border-b border-border/80 pb-3">
              1. Visão Geral
            </h2>
            <p>
              O <strong>NFT Marketplace</strong> é uma aplicação web rica desenvolvida para atender integralmente ao desafio técnico proposto. A solução combina a estética refinada do design fornecido no Figma com engenharia de software frontend robusta e orientada a contratos.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl border border-border bg-surface space-y-2">
                <strong className="text-foreground text-xs uppercase tracking-wider block">Escopo Principal</strong>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Catálogo com filtros combináveis e sincronização total na URL</li>
                  <li>Detalhes da obra com galeria, histórico e atualização otimista</li>
                  <li>Carrinho persistente com suporte a cupons e cálculo em Decimal.js</li>
                  <li>Checkout com carteiras web3 e chave de idempotência</li>
                  <li>Sessão com autenticação e isolamento estrito de cache</li>
                  <li>Eventos em tempo real via Socket.IO Client</li>
                </ul>
              </div>
              <div className="p-4 rounded-xl border border-border bg-surface space-y-2">
                <strong className="text-foreground text-xs uppercase tracking-wider block">Stack Tecnológica</strong>
                <ul className="list-disc list-inside space-y-1 text-xs font-mono">
                  <li>React 18 + TypeScript + Vite 6</li>
                  <li>TanStack Router v1 + TanStack Query v5</li>
                  <li>Axios + Mock Service Worker (MSW) 2</li>
                  <li>Socket.IO Client + @mswjs/socket.io-binding</li>
                  <li>Tailwind CSS + Radix UI Primitives</li>
                  <li>Playwright E2E + Lighthouse CLI</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 2: Instalação & Setup */}
          <section id="instalacao" className="space-y-4">
            <h2 className="text-2xl font-extrabold text-foreground tracking-tight border-b border-border/80 pb-3">
              2. Instalação & Desenvolvimento
            </h2>
            <p>
              O projeto requer <strong>Node.js 18+</strong> (testado em Node 22). Todas as dependências e ferramentas de compilação são configuradas através do npm standard.
            </p>
            <div className="p-4 rounded-xl border border-border bg-surface space-y-3 font-mono text-xs">
              <span className="text-foreground-muted block"># 1. Clonar repositório e instalar dependências</span>
              <pre className="p-3 rounded bg-black/60 text-primary overflow-x-auto">
{`git clone <url-do-repositorio>
cd nft-marketplace
npm install`}
              </pre>

              <span className="text-foreground-muted block mt-3"># 2. Executar servidor de desenvolvimento local (porta 3000)</span>
              <pre className="p-3 rounded bg-black/60 text-primary overflow-x-auto">
{`npm run dev`}
              </pre>

              <span className="text-foreground-muted block mt-3"># 3. Gerar build estático para produção e testar preview local</span>
              <pre className="p-3 rounded bg-black/60 text-primary overflow-x-auto">
{`npm run build
npm run preview`}
              </pre>

              <span className="text-foreground-muted block mt-3"># 4. Executar testes E2E e auditoria Lighthouse</span>
              <pre className="p-3 rounded bg-black/60 text-primary overflow-x-auto">
{`npm run test:e2e
npm run lighthouse`}
              </pre>
            </div>
          </section>

          {/* Section 3: Arquitetura */}
          <section id="arquitetura" className="space-y-4">
            <h2 className="text-2xl font-extrabold text-foreground tracking-tight border-b border-border/80 pb-3">
              3. Arquitetura do Sistema
            </h2>
            <p>
              A estrutura do projeto adota divisão modular por domínios e responsabilidades bem delineadas:
            </p>
            <div className="p-4 rounded-xl border border-border bg-surface font-mono text-xs space-y-1.5 leading-relaxed">
              <p><strong className="text-primary">src/app/</strong>: Provedores centrais, inicialização de rotas e cliente TanStack Query.</p>
              <p><strong className="text-primary">src/routes/</strong>: Configuração das rotas estáticas e parâmetros de busca via TanStack Router.</p>
              <p><strong className="text-primary">src/features/catalog/</strong>: Catálogo de NFTs, filtros combináveis, detalhes da obra e cards.</p>
              <p><strong className="text-primary">src/features/cart/</strong>: Carrinho de compras, cupons e totalizadores em ETH.</p>
              <p><strong className="text-primary">src/features/checkout/</strong>: Fluxo de pagamento, carteiras web3 e chave de idempotência.</p>
              <p><strong className="text-primary">src/features/orders/</strong>: Recibo imutável e histórico de pedidos do usuário.</p>
              <p><strong className="text-primary">src/features/auth/</strong>: Autenticação, recuperação de token JWT e isolamento de cache.</p>
              <p><strong className="text-primary">src/features/profile/</strong>: Gestão de perfil, avatar, alteração de senha e carteiras.</p>
              <p><strong className="text-primary">src/lib/</strong>: Instância Axios, cálculos financeiros em Decimal.js e utilitários.</p>
              <p><strong className="text-primary">src/mocks/</strong>: Handlers MSW REST, banco em memória com persistência e cenários de teste.</p>
              <p><strong className="text-primary">src/realtime/</strong>: Cliente Socket.IO e despachador de eventos.</p>
              <p><strong className="text-primary">tests/e2e/</strong>: Suíte de testes ponta a ponta com Playwright.</p>
            </div>
          </section>

          {/* Section 4: APIs Simuladas */}
          <section id="apis" className="space-y-4">
            <h2 className="text-2xl font-extrabold text-foreground tracking-tight border-b border-border/80 pb-3">
              4. APIs REST Simuladas (MSW)
            </h2>
            <p>
              Todas as interações de rede são interceptadas pelo <strong>Mock Service Worker (MSW)</strong>, garantindo que nenhum componente possua dados fictícios estáticos contornando o fluxo HTTP.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border border-border rounded-lg overflow-hidden">
                <thead className="bg-surface-secondary text-foreground uppercase tracking-wider font-bold">
                  <tr>
                    <th className="p-3">Método</th>
                    <th className="p-3">Endpoint</th>
                    <th className="p-3">Descrição</th>
                    <th className="p-3">Status de Sucesso</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-surface">
                  <tr>
                    <td className="p-3 font-mono font-bold text-emerald-400">POST</td>
                    <td className="p-3 font-mono">/api/auth/login</td>
                    <td className="p-3">Autentica usuário e retorna Bearer token</td>
                    <td className="p-3 font-mono">200 OK</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono font-bold text-emerald-400">POST</td>
                    <td className="p-3 font-mono">/api/auth/register</td>
                    <td className="p-3">Cadastra novo usuário e associa carteira</td>
                    <td className="p-3 font-mono">201 Created</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono font-bold text-sky-400">GET</td>
                    <td className="p-3 font-mono">/api/nfts</td>
                    <td className="p-3">Listagem paginada com busca e múltiplos filtros</td>
                    <td className="p-3 font-mono">200 OK</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono font-bold text-sky-400">GET</td>
                    <td className="p-3 font-mono">/api/nfts/:id</td>
                    <td className="p-3">Detalhes completos, traits e histórico da obra</td>
                    <td className="p-3 font-mono">200 OK (ou 404)</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono font-bold text-emerald-400">POST</td>
                    <td className="p-3 font-mono">/api/favorites/:id</td>
                    <td className="p-3">Alterna favorito do usuário autenticado</td>
                    <td className="p-3 font-mono">200 OK</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono font-bold text-emerald-400">POST</td>
                    <td className="p-3 font-mono">/api/cart/items</td>
                    <td className="p-3">Adiciona item ao carrinho com validação de estoque</td>
                    <td className="p-3 font-mono">200 OK</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono font-bold text-emerald-400">POST</td>
                    <td className="p-3 font-mono">/api/orders</td>
                    <td className="p-3">Criação idempotente de pedido com snapshot</td>
                    <td className="p-3 font-mono">201 Created / 200 Replay</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono font-bold text-sky-400">GET</td>
                    <td className="p-3 font-mono">/api/wallets</td>
                    <td className="p-3">Consulta carteiras vinculadas à conta</td>
                    <td className="p-3 font-mono">200 OK</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 5: Autenticação */}
          <section id="autenticacao" className="space-y-4">
            <h2 className="text-2xl font-extrabold text-foreground tracking-tight border-b border-border/80 pb-3">
              5. Autenticação & Sessão
            </h2>
            <p>
              O sistema exige autenticação para as rotas protegidas (<code>/checkout</code>, <code>/profile</code>, gestão de carteiras e favoritos). O fluxo possui preservação de rota de origem (<code>redirectAfterAuth</code>) para que o usuário não perca seu contexto de compra.
            </p>
            <div className="p-4 rounded-xl border border-border bg-surface space-y-3">
              <strong className="text-xs uppercase tracking-wider text-primary block">Contas de Teste Pré-cadastradas:</strong>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-3 rounded bg-surface-secondary border border-border/60">
                  <span className="text-foreground block font-bold">Alice Vance</span>
                  <span className="text-foreground-muted block">E-mail: alice@example.com</span>
                  <span className="text-foreground-muted block">Senha: Password123!</span>
                </div>
                <div className="p-3 rounded bg-surface-secondary border border-border/60">
                  <span className="text-foreground block font-bold">Bob Martin</span>
                  <span className="text-foreground-muted block">E-mail: bob@example.com</span>
                  <span className="text-foreground-muted block">Senha: Password123!</span>
                </div>
              </div>
              <p className="text-xs text-foreground-muted pt-2 border-t border-border/40">
                <strong>Isolamento de Cache:</strong> Ao efetuar logout ou trocar de usuário, o método <code>clearPrivateCache()</code> limpa completamente as queries de carteiras, favoritos, pedidos e carrinho no TanStack Query, impossibilitando qualquer exposição indevida entre identidades.
              </p>
            </div>
          </section>

          {/* Section 6: Carrinho, Cotação & Pedidos */}
          <section id="carrinho" className="space-y-4">
            <h2 className="text-2xl font-extrabold text-foreground tracking-tight border-b border-border/80 pb-3">
              6. Carrinho, Cotação & Pedidos
            </h2>
            <p>
              Todos os valores financeiros em ETH são manipulados via <code>Decimal.js</code> com precisão de 28 dígitos decimais, impedindo anomalias de arredondamento de ponto flutuante IEEE 754 (como <code>0.1 + 0.2 !== 0.3</code>).
            </p>
            <div className="p-4 rounded-xl border border-border bg-surface space-y-3 text-xs">
              <strong className="text-foreground text-xs uppercase tracking-wider block">Garantias de Idempotência:</strong>
              <p>
                Ao submeter um pedido, uma chave exclusiva <code>idempotencyKey</code> é transmitida no payload.
              </p>
              <ul className="list-disc list-inside space-y-1 text-foreground-muted">
                <li><strong>Mesma chave + mesmo payload:</strong> Recupera o pedido já existente sem criar uma segunda cobrança (Status 200).</li>
                <li><strong>Mesma chave + payload alterado:</strong> Dispara erro HTTP 409 Conflict.</li>
                <li><strong>Snapshot imutável:</strong> O recibo gerado preserva os valores e títulos exatos no momento da compra, permanecendo inalterado mesmo que o catálogo sofra modificações posteriores.</li>
              </ul>
            </div>
          </section>

          {/* Section 7: Socket.IO & Tempo Real */}
          <section id="tempo-real" className="space-y-4">
            <h2 className="text-2xl font-extrabold text-foreground tracking-tight border-b border-border/80 pb-3">
              7. Socket.IO & Tempo Real
            </h2>
            <p>
              A aplicação utiliza <code>socket.io-client</code> conectado à simulação estática via <code>@mswjs/socket.io-binding</code> e WebSocket nativo.
            </p>
            <div className="p-4 rounded-xl border border-border bg-surface space-y-3 text-xs">
              <strong className="text-foreground text-xs uppercase tracking-wider block">Regras de Consistência e Monotonia:</strong>
              <ul className="list-disc list-inside space-y-1.5 text-foreground-muted">
                <li><strong>Evento <code>nft.updated</code>:</strong> Carrega <code>id</code> estável, versão sequencial, novo preço e disponibilidade. Atualiza catálogo, detalhe e carrinho.</li>
                <li><strong>Evento <code>order.updated</code>:</strong> Notifica alteração de status e confirmação de transação blockchain.</li>
                <li><strong>Tolerância a duplicatas e eventos antigos:</strong> O cliente descarta eventos cujo <code>id</code> já foi processado ou cuja versão seja menor ou igual à já memorizada.</li>
                <li><strong>Bloqueio de Checkout Obrigatório:</strong> Se um NFT no carrinho sofrer alteração de preço, a interface impede a confirmação do pedido até que o usuário clique em "Revisar e Aceitar Nova Cotação".</li>
              </ul>
            </div>
          </section>

          {/* Section 8: Cenários */}
          <section id="cenarios" className="space-y-4">
            <h2 className="text-2xl font-extrabold text-foreground tracking-tight border-b border-border/80 pb-3">
              8. Cenários de Demonstração
            </h2>
            <p>
              Na barra superior <strong>Simulador de Cenários MSW</strong>, avaliadores técnicos podem alternar facilmente entre comportamentos determinísticos:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg border border-border bg-surface">
                <strong className="text-foreground block">Rede Lenta (1.2s)</strong>
                <span className="text-foreground-muted">Permite observar os esqueletos Shimmer nas transições de página.</span>
              </div>
              <div className="p-3 rounded-lg border border-border bg-surface">
                <strong className="text-foreground block">Falha de Servidor (500)</strong>
                <span className="text-foreground-muted">Demonstra tratamento de erro resiliente com botão de retry.</span>
              </div>
              <div className="p-3 rounded-lg border border-border bg-surface">
                <strong className="text-foreground block">Sessão Expirada (401)</strong>
                <span className="text-foreground-muted">Testa o interceptor Axios com deslogamento limpo e abertura do modal.</span>
              </div>
              <div className="p-3 rounded-lg border border-border bg-surface">
                <strong className="text-foreground block">Falha de Pagamento (402)</strong>
                <span className="text-foreground-muted">Verifica a preservação dos itens no carrinho após recusa da carteira.</span>
              </div>
              <div className="p-3 rounded-lg border border-border bg-surface">
                <strong className="text-foreground block">Disparar Evento Socket.IO</strong>
                <span className="text-foreground-muted">Altera o preço do BAYC #7090 em tempo real para testar o bloqueio no checkout.</span>
              </div>
              <div className="p-3 rounded-lg border border-border bg-surface">
                <strong className="text-foreground block">Reset dos Mocks</strong>
                <span className="text-foreground-muted">Restaura o estado inicial padrão e limpa o localStorage em 1 clique.</span>
              </div>
            </div>
          </section>

          {/* Section 9: Testes */}
          <section id="testes" className="space-y-4">
            <h2 className="text-2xl font-extrabold text-foreground tracking-tight border-b border-border/80 pb-3">
              9. Testes E2E & Qualidade
            </h2>
            <p>
              O projeto possui suíte completa de testes executáveis com <strong>Playwright</strong> cobrindo os 12 fluxos fundamentais exigidos pelo enunciado e testes de regressão visual.
            </p>
            <div className="p-4 rounded-xl border border-border bg-surface font-mono text-xs space-y-2">
              <span className="text-foreground-muted block"># Executar suíte completa de testes E2E</span>
              <pre className="p-2.5 rounded bg-black/60 text-emerald-400">npx playwright test</pre>

              <span className="text-foreground-muted block mt-2"># Executar testes visuais com baselines</span>
              <pre className="p-2.5 rounded bg-black/60 text-emerald-400">npm run test:visual</pre>

              <span className="text-foreground-muted block mt-2"># Executar auditoria de métricas com Lighthouse</span>
              <pre className="p-2.5 rounded bg-black/60 text-emerald-400">npm run lighthouse</pre>
            </div>
          </section>

          {/* Section 10: Publicação no Cloudflare Pages */}
          <section id="deploy" className="space-y-4">
            <h2 className="text-2xl font-extrabold text-foreground tracking-tight border-b border-border/80 pb-3">
              10. Publicação no Cloudflare Pages
            </h2>
            <p>
              A aplicação está 100% preparada para deploy contínuo estático no <strong>Cloudflare Pages</strong>:
            </p>
            <div className="p-4 rounded-xl border border-border bg-surface space-y-2 text-xs">
              <ul className="list-disc list-inside space-y-1">
                <li><strong>Framework preset:</strong> React (Vite)</li>
                <li><strong>Build command:</strong> <code>npm run build</code></li>
                <li><strong>Build output directory:</strong> <code>dist</code></li>
                <li><strong>Roteamento SPA:</strong> Configurado via <code>public/_redirects</code> (<code>/* /index.html 200</code>) garantindo acesso direto a <code>/docs</code>, <code>/checkout</code> e <code>/profile</code>.</li>
                <li><strong>Variáveis de ambiente:</strong> <code>VITE_ENABLE_MOCKS=true</code> (permite que a demonstração opere de forma 100% autônoma e determinística na nuvem).</li>
              </ul>
            </div>
          </section>

          {/* Section 11: Limitações Conhecidas */}
          <section id="limitacoes" className="space-y-4">
            <h2 className="text-2xl font-extrabold text-foreground tracking-tight border-b border-border/80 pb-3">
              11. Limitações Conhecidas
            </h2>
            <div className="p-4 rounded-xl border border-border bg-surface space-y-2 text-xs">
              <p>
                Como o Cloudflare Pages é um provedor de hospedagem de assets estáticos (sem servidor Node.js com processos WebSocket contínuos mantidos em memória de longa duração), a camada de tempo real utiliza o binding <code>@mswjs/socket.io-binding</code> com interceptação de WebSocket no navegador e despachador interno coordenado, garantindo reprodução fidedigna do protocolo Socket.IO sem requisições a servidores externos instáveis.
              </p>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
