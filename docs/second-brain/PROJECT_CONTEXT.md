# Contexto do projeto

Kurio é um marketplace demonstrativo de NFTs. APIs, sessão, pagamento, carteiras e tempo real são simulados localmente. Integrações reais com blockchain, OAuth e gateway de pagamento não fazem parte do comportamento implementado.

## Fontes e escopo

- Critérios funcionais: [`SPECIFICATION.md`](SPECIFICATION.md), transcrição anexada pelo usuário.
- O arquivo Figma e os exports usados como referência permanecem no workspace local e são ignorados pelo Git; não estão incluídos no repositório.
- A UI deve ser validada em 390, 768 e 1440 px; o projeto também possui cobertura Full HD a 1920×1080.
- Conversa anterior cobre fidelidade de NFT, carrinho, checkout, login/cadastro, perfil/carteiras, navbar mobile, header, filtros e otimização de imagens. Veja [`CONVERSATION_BACKLOG.md`](CONVERSATION_BACKLOG.md).

## Critérios de aceite

Fluxos de descoberta, autenticação, compra e conta devem funcionar com MSW; dados de ETH trafegam como strings decimais; mudanças de preço e pedidos sincronizam por Socket.IO; responsividade, acessibilidade e regressão visual precisam de evidência. Não declarar pixel-perfect apenas porque um snapshot local passou: ele compara contra baseline versionada, não diretamente com o Figma.

## Ambiente inspecionado

- Node/npm via `package.json`; React 18, TypeScript, Vite 6, Tailwind 3.
- Branch atual `main` com alterações locais preexistentes.
- URL local observada na conversa: `http://127.0.0.1:3000`.
- URL pública documentada em `README.md`: `https://nft-marketplace-6b1.pages.dev`; ela está desatualizada em relação ao checkout local.
