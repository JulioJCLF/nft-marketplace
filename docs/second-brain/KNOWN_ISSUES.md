# Limitações e pendências

- As referências originais do Figma ficam apenas no workspace local, fora do Git. Os snapshots Playwright comparam regressões contra baselines do projeto; não certificam correspondência pixel a pixel com o Figma.
- As avaliações, autenticação, carteiras, pedidos e pagamentos são simulados. Não há OAuth, pagamento real nem transação on-chain.
- O desafio cita shadcn/ui; a aplicação usa componentes locais com Tailwind, Radix, CVA e `cn`, sem geração explícita pelo CLI shadcn.
- A demonstração pública existente pode estar desatualizada em relação a este checkout. O build local foi validado; deploy e smoke test após publicação continuam pendentes.

Resultados reproduzíveis estão em [`VALIDATION.md`](VALIDATION.md). A especificação e cobertura por requisito estão em [`SPECIFICATION_TRACEABILITY.md`](SPECIFICATION_TRACEABILITY.md).
