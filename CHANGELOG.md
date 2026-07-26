# Changelog

Este projeto segue, dentro do possível, o formato de [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/).
Como este repositório contém duas aplicações independentes, cada entrada indica
a qual delas se refere: **[desktop]** ou **[web]**.

## [Não lançado]

Nenhuma das duas aplicações foi publicada publicamente ainda (sem release do
GitHub, sem tag, sem URL do GitHub Pages) — todas as entradas abaixo
descrevem o estado atual do repositório local.

### Adicionado

- **[web]** `v0.1.0`. Nove ferramentas completas, sem limitações relevantes:
  unir PDFs, dividir (6 modos: cada página, intervalos personalizados, a
  cada N páginas, dividir em N arquivos, pares/ímpares, extrair seleção),
  organizar páginas (reordenar/girar/duplicar/excluir/inserir em branco,
  com desfazer/refazer), extrair páginas, imagens → PDF, PDF → imagens,
  marca d'água, numeração de páginas, edição de metadados.
- **[web]** Três ferramentas completas com limitações reais e deliberadas
  (descritas em `docs/LIMITATIONS.md` e `docs/COMPATIBILITY.md`): OCR
  (texto pesquisável) via Tesseract.js processado localmente; assinatura
  visual/carimbo (texto, desenho à mão ou imagem — estritamente visual,
  sem certificado PFX/P12); compressão básica (recompressão de imagens
  JPEG já embutidas).
- **[web]** Página "Web × Desktop", acessível pela barra lateral,
  explicando a diferença entre ferramentas com limitação permanente
  (dependem de binário nativo ou material sensível) e ferramentas ainda
  não portadas (sem impedimento técnico definitivo), com o comando real
  para instalar o aplicativo desktop.
- **[web]** PWA instalável com atualização controlada (`registerType:
  "prompt"` — nunca silenciosa) e cache do service worker restrito a
  arquivos da própria aplicação (nunca documentos do usuário); caminho-base
  ajustado automaticamente em build de produção/CI para publicação em
  sub-caminho (GitHub Pages).
- **[web]** Layout responsivo (barra lateral vira gaveta off-canvas abaixo
  de 640px, com fechamento por Esc/clique fora/seleção de ferramenta) e
  auditoria real de acessibilidade (WCAG 2.1 AA via axe-core) em todas as
  telas, ambos os temas e duas larguras de viewport.
- **[web]** Suíte de testes real: Vitest (67 testes unitários/componente) e
  Playwright + axe-core (16 arquivos de spec, 68 testes end-to-end,
  executados de fato neste ambiente contra um build de produção),
  cobrindo cada ferramenta com verificação de conteúdo binário real
  (`pdf-lib`/`pdfjs-dist`/`jszip`), a tela inicial, a página Web × Desktop,
  o layout responsivo e o PWA/caminho-base.
- **[desktop/web]** Estrutura de repositório único com documentação de
  arquitetura, privacidade, segurança, compatibilidade e limitações.

### Alterado

- **[desktop]** Reformulação visual completa (v1.7.0): novo sistema de design,
  temas claro/escuro revisados, ícones vetoriais próprios, componentes de
  alerta e área de arraste redesenhados, hierarquia de botões consistente,
  correções de acentuação em português. Nenhuma funcionalidade removida.

### Corrigido

- **[web]** Violação de acessibilidade crítica no componente compartilhado
  `DropZone` (`<input type="file">` oculto sem nome acessível) — corrigida
  com `aria-label`, beneficiando toda ferramenta que recebe arquivo.
- **[web]** Contraste de cor insuficiente (WCAG 1.4.3) no selo "COM
  LIMITAÇÕES", no título de alerta de nível "warning" e em texto branco
  sobre botões primário/perigo em tema escuro — corrigido com tokens de
  cor dedicados (`--warning`, `--accent-solid`, `--danger-solid`).
- **[web]** Controles interativos aninhados (`<div role="button">` em volta
  de um `<button>` real) confundiam navegação por teclado e leitores de
  tela em `DropZone` — removida a role/tabIndex redundante.
- **[web]** `MediaBox` de 200×200pt nos PDFs sintéticos de teste causava
  truncamento silencioso de texto no `pdfjs-dist` ao extrair conteúdo de
  páginas com texto perto da borda — corrigido para tamanho A4
  (`shared/test-fixtures/generate.mjs`).
- **[web]** Bug intermitente em `compress.spec.ts`: `Buffer.from(base64)`
  podia devolver uma view dentro do pool interno de 8 KB do Node, e o
  `JpegEmbedder` do pdf-lib lê o `ArrayBuffer` subjacente ignorando o
  offset — corrigido copiando para um buffer próprio via `slice()`.
- **[web]** `require()` usado dentro de um arquivo de teste ESM
  (`ocr.spec.ts`) quebrava o teste de reconhecimento real de OCR —
  corrigido para usar `readFileSync` já importado via ES modules.
- **[web]** Seletores Playwright ambíguos (mesmo texto de botão na barra
  lateral e no cartão da tela inicial) quebravam os testes e2e de
  `organize`, `images-to-pdf`, `pdf-to-images` e `split` — corrigidos com
  locators mais específicos.

### Notas de compatibilidade

- Consulte `docs/COMPATIBILITY.md` para a tabela completa de paridade entre
  desktop e web, ferramenta por ferramenta.
