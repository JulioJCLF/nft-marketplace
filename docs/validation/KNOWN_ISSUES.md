# Limitações e pendências

- As referências originais do Figma ficam apenas no workspace local, fora do Git. Os snapshots Playwright comparam regressões contra baselines do projeto; não certificam correspondência pixel a pixel com o Figma.
- As avaliações, autenticação, carteiras, pedidos e pagamentos são simulados. Não há OAuth, pagamento real nem transação on-chain.
- A demonstração pública (`https://nft-marketplace-6b1.pages.dev`) foi atualizada com este checkout e validada via smoke test nas rotas principais e no Service Worker.

Resultados reproduzíveis estão em [`VALIDATION.md`](VALIDATION.md). A especificação e cobertura por requisito estão em [`SPECIFICATION_TRACEABILITY.md`](SPECIFICATION_TRACEABILITY.md).
