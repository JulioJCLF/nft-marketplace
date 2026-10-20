# Tarefas e próxima ordem

## Concluído nesta execução

- Corrigir o acionamento do drawer de filtros no mobile e teste auxiliar.
- Fazer timeout de pedido ocorrer depois do commit simulado e reconciliar por chave idempotente após 504/refresh.
- Associar labels no formulário de autenticação e cobrir cadastro duplicado e foco via teclado.
- Cobrir 768px em E2E e baselines visuais; capturas existentes cobrem 390, 1440 e 1920×1080.
- Ampliar teste visual full-page para percorrer os sentinels lazy, sem trocar tolerância de pixel.
- Implementar pedido pendente, eventos Socket.IO de confirmação/recusa, dedupe de eventos, reconexão e recuperar recibo; adicionar E2E.
- Completar snapshots responsivos para perfil, carteiras e confirmação.
- Completar typecheck, lint, build, E2E, visuais e auditoria Lighthouse; registrar os resultados em `VALIDATION.md`.

## Pendências prioritárias

1. Cobrir filtro composto/refresh, conflito idempotente, expiração 401, cupom inválido/expirado, edição de carteira e senha.
2. Comparar diretamente cada tela com os exports do Figma em resolução idêntica; os snapshots atuais são regressões, não prova de 1:1.
3. Resolver as URLs públicas conflitantes e executar o smoke test remoto depois da publicação do usuário.
4. Validar a entrega a partir de checkout limpo sem mexer no working tree atual.

## Estado da validação

Typecheck, lint, build, E2E (69), visuais (25) e quatro auditorias Lighthouse (3 execuções cada) concluídos. Consulte `VALIDATION.md` para comandos/medianas e `KNOWN_ISSUES.md` para gaps restantes.
