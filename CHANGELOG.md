# Changelog

Este projeto segue, dentro do possível, o formato de [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/).
Como este repositório contém duas aplicações independentes, cada entrada indica
a qual delas se refere: **[desktop]** ou **[web]**.

## [Não lançado]

### Adicionado

- **[web]** Primeira versão pública da aplicação web: ferramentas de unir,
  dividir, extrair páginas, marca d'água, numeração de páginas e edição de
  metadados, todas executadas localmente no navegador (sem backend, sem
  upload de documentos).
- **[web]** PWA instalável com atualização controlada (nunca silenciosa) e
  cache restrito a arquivos da aplicação (nunca documentos do usuário).
- **[web]** Suíte de testes: Vitest (unidade), Testing Library (componentes),
  Playwright + axe-core (E2E e acessibilidade — configurados; ver
  `docs/WEB.md` para o status real de execução em cada ambiente).
- **[desktop/web]** Estrutura de repositório único com documentação de
  arquitetura, privacidade, segurança, compatibilidade e limitações.

### Alterado

- **[desktop]** Reformulação visual completa (v1.7.0): novo sistema de design,
  temas claro/escuro revisados, ícones vetoriais próprios, componentes de
  alerta e área de arraste redesenhados, hierarquia de botões consistente,
  correções de acentuação em português. Nenhuma funcionalidade removida.

### Notas de compatibilidade

- Consulte `docs/COMPATIBILITY.md` para a tabela completa de paridade entre
  desktop e web, ferramenta por ferramenta.
