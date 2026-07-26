# Aplicativo Web

`web/` — React 19 + TypeScript + Vite, publicado como site estático no
GitHub Pages. **Não existe backend nesta versão**: todo processamento
acontece no navegador do usuário.

## Executando localmente

```bash
cd web
npm ci
npm run dev
```

## Scripts disponíveis

| Script | Finalidade |
|---|---|
| `npm run dev` | Servidor de desenvolvimento (Vite) |
| `npm run build` | Checagem de tipos + build de produção (`dist/`) |
| `npm run preview` | Serve o build de produção localmente |
| `npm run lint` | Lint (`oxlint`) |
| `npm run typecheck` | Checagem de tipos sem gerar arquivos |
| `npm run test` | Testes unitários e de componente (Vitest + Testing Library) |
| `npm run test:e2e` | Testes end-to-end (Playwright + axe-core) |
| `npm run fixtures:generate` | Gera PDFs sintéticos para teste (`shared/test-fixtures/`) |

## Arquitetura do motor de PDF

```
web/src/lib/pdf/
├── types.ts          Tipos compartilhados (LoadedDocument, PageState, ...)
├── validation.ts      Valida assinatura mágica do arquivo (nunca confia só na extensão)
├── pdfjsSetup.ts       Configura o worker do pdf.js (bundlado, sem CDN)
├── loadDocument.ts     Abre um PDF (detecta senha, arquivo corrompido, etc.)
├── thumbnails.ts       Renderiza páginas sob demanda (nunca todas de uma vez)
├── operations.ts       Operações via pdf-lib (unir, dividir, extrair, marca d'água, ...)
├── zip.ts             Empacotamento em .zip e download via Blob
└── workerClient.ts     Cliente para falar com o Web Worker
web/src/workers/pdfWorker.ts   Executa as operações fora da thread principal
```

Toda operação que processa o conteúdo do PDF roda dentro do Web Worker — a
interface nunca trava durante o processamento, e o cancelamento é possível a
qualquer momento (token de cancelamento cooperativo).

## Privacidade — o que isso significa na prática

- Nenhum `fetch`/`XMLHttpRequest` envia bytes de um PDF do usuário para
  qualquer lugar; a Content Security Policy (`connect-src 'self'`) impede
  conexões de rede para além da própria origem.
- `pdf.js` é configurado com `disableAutoFetch`/`disableStream` — mesmo um PDF
  malicioso não consegue disparar requisições de rede automáticas.
- Arquivos ficam apenas em memória (nunca em `localStorage`/IndexedDB como
  documento); o botão **"Limpar sessão"** descarta tudo remontando a árvore
  de componentes React.
- Um aviso de "trabalho não salvo" aparece antes de recarregar/fechar a aba
  se algum arquivo foi carregado na sessão.

## PWA e modo offline

Configurado via `vite-plugin-pwa` com `registerType: "prompt"` — a aplicação
**nunca** atualiza silenciosamente; o usuário é avisado e decide quando
recarregar. O cache do service worker inclui apenas os arquivos da própria
aplicação (JS/CSS/HTML/SVG/fontes) — nunca documentos do usuário.

## Estado real dos testes (honestidade sobre o que foi executado)

- **Vitest (unitário/componente):** executado neste ambiente de
  desenvolvimento — 67 testes, todos passando, cobrindo o motor de PDF
  (`operations.ts`, incluindo compressão, assinatura visual e OCR),
  validação de arquivo, parsing de intervalos de página e `HomeScreen.tsx`.
  (Nota: esta seção descreve o essencial; para o inventário completo e
  atualizado de ferramentas ver `docs/COMPATIBILITY.md` — uma reescrita
  completa deste documento está prevista numa fase de documentação futura.)
- **Lint (`oxlint`) e checagem de tipos (`tsc -b`):** executados neste
  ambiente — sem erros.
- **Build de produção (`vite build`):** executado neste ambiente — sucesso,
  incluindo geração do service worker e do manifesto PWA.
- **Playwright + axe-core (E2E/acessibilidade):** ao contrário do que este
  documento afirmava antes, os testes **foram de fato executados neste
  ambiente**, não só escritos: o Chromium headless do sandbox tinha uma
  dependência de sistema faltando (`libXdamage.so.1`) e não há privilégio de
  root para instalar via `apt`; contornado extraindo o `.deb` já baixado com
  `dpkg-deb -x` (sem privilégio) e apontando via `LD_LIBRARY_PATH` só para os
  processos de teste — nenhuma mudança de sistema, nenhum pacote instalado
  globalmente. A suíte completa (9 arquivos de spec, cobrindo cada
  ferramenta, a tela inicial, a página Web × Desktop e o layout responsivo)
  roda de verdade contra um build de produção real. O workflow
  `web-tests.yml` do GitHub Actions continua sendo a fonte de verdade formal
  para CI (esse workaround não está automatizado lá), mas não é mais correto
  dizer que os testes "nunca rodaram" neste projeto.

## Acessibilidade e responsividade (Fase 6)

Auditoria real feita com axe-core (`@axe-core/playwright`) contra todas as
telas (inicial, cada ferramenta, Web × Desktop), nos temas claro e escuro, e
em duas larguras de viewport (1280px e 375px). Achados reais corrigidos:

- **Contraste de cor insuficiente** (regra `color-contrast`, WCAG 1.4.3):
  o selo "COM LIMITAÇÕES" e o título de `InlineAlert` no nível "warning" só
  alcançavam 3.64:1 em tema claro (abaixo do 4.5:1 exigido para texto
  normal) — `--warning` escurecido para 5.37:1. Em tema escuro, texto branco
  sobre `.btn-primary` (2.99:1) e sobre o hover de `.btn-danger` (3.27:1)
  também falhavam — criados tokens `--accent-solid`/`--accent-solid-hover`/
  `--danger-solid`, com tons próprios só para fundo sólido com texto branco,
  sem alterar `--accent`/`--danger` usados como texto (que já eram
  compatíveis). Ver `web/src/styles/tokens.css`.
- **Controles interativos aninhados** (regra `nested-interactive`, WCAG
  4.1.2): `DropZone.tsx` envolvia um `<button>` real dentro de um
  `<div role="button" tabIndex={0}>` — confundia navegação por Tab e
  leitores de tela em toda ferramenta que recebe arquivo. Removido o
  role/tabIndex/onKeyDown redundante do `<div>`; o `<button>` interno
  "Selecionar arquivos" passou a ser o único controle de teclado real.
- **Layout quebrado em telas estreitas**: sem nenhuma media query no
  projeto, em ≤375px de largura o cabeçalho estourava (botão de tema
  cortado, textos quebrando em várias linhas) e a barra lateral fixa de
  260px espremia o conteúdo principal — confirmado com captura de tela real
  antes da correção. Adicionado um breakpoint em 640px: abaixo dele, a barra
  lateral vira uma gaveta (off-canvas) acionada por um botão de menu no
  cabeçalho, com fundo escurecido, fechamento por Esc/clique fora/seleção de
  ferramenta, e o texto do selo de privacidade e do botão "Limpar sessão"
  passam a ficar só para leitor de tela (ícone permanece visível). Ver
  `web/src/components/AppShell.tsx` e o bloco `@media` em
  `web/src/styles/global.css`.

Cobertura de teste real para essas correções: `web/tests-e2e/responsive.spec.ts`
(8 testes: gaveta abre/fecha por botão, backdrop e Esc; navegação fecha a
gaveta; cabeçalho não estoura em 375px; sem violações críticas/sérias com a
gaveta aberta) e reexecução de toda a suíte Playwright existente para
confirmar ausência de regressão.

## Limites de desempenho

- Miniaturas são renderizadas por página, sob demanda — nunca o documento
  inteiro de uma vez.
- Tamanho máximo de arquivo configurável (`MAX_FILE_SIZE_BYTES`, 200 MB por
  padrão) — arquivos maiores são rejeitados com uma mensagem clara.
- URLs de Blob são revogadas logo após o início do download
  (`URL.revokeObjectURL`).
