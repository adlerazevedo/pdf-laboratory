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

### Caminho-base (GitHub Pages)

`vite.config.ts` define `base: "/pdf-laboratory/"` apenas em build de
produção/CI (`NODE_ENV=production` ou `CI=true`); em desenvolvimento o
`base` continua `/`. Isso afeta o `start_url`/`scope` do manifesto PWA, as
URLs de todos os assets/ícones e o registro do service worker — todos
verificados de fato (não só assumidos corretos) em
`web/tests-e2e/pwa.spec.ts` (Fase 7): manifesto é servido como JSON válido
com `start_url`/`scope` iguais a `/pdf-laboratory/`, cada ícone declarado
retorna HTTP 200 (não só está listado), o service worker atinge estado
`active` no escopo correto (via `navigator.serviceWorker.ready`, que só
resolve com um worker realmente ativo — checar via `getRegistration()`
logo após o load provou ser cedo demais e instável), o cache do Workbox
nunca contém uma entrada que pareça um PDF de usuário, nenhum recurso da
carga inicial retorna ≥400, e a navegação direta para `/pdf-laboratory/`
(sem passar pela raiz `/`) carrega a aplicação normalmente.

## Estado real dos testes (honestidade sobre o que foi executado)

- **Vitest (unitário/componente):** executado neste ambiente de
  desenvolvimento — 67 testes, todos passando, cobrindo o motor de PDF
  (`operations.ts`, incluindo compressão, assinatura visual e OCR),
  validação de arquivo, parsing de intervalos de página e `HomeScreen.tsx`.
  Para o inventário completo e atualizado de ferramentas, ver
  `docs/COMPATIBILITY.md`.
- **Lint (`oxlint`) e checagem de tipos (`tsc -b`):** executados neste
  ambiente — sem erros.
- **Build de produção (`vite build`):** executado neste ambiente — sucesso,
  incluindo geração do service worker e do manifesto PWA.
- **Playwright + axe-core (E2E/acessibilidade):** os testes são de fato
  executados neste ambiente contra um build de produção real, não apenas
  escritos: o Chromium headless do sandbox tinha uma dependência de sistema
  faltando (`libXdamage.so.1`) e não há privilégio de root para instalar via
  `apt`; contornado extraindo o `.deb` já baixado com `dpkg-deb -x` (sem
  privilégio) e apontando via `LD_LIBRARY_PATH` só para os processos de
  teste — nenhuma mudança de sistema, nenhum pacote instalado globalmente.
  A suíte completa (16 arquivos de spec, 68 testes) roda de verdade: cada
  uma das 12 ferramentas com tela própria, a tela inicial, a página Web ×
  Desktop, o layout responsivo/WCAG e o PWA/caminho-base (Fase 7). Boa
  parte dos specs de ferramenta verifica o conteúdo binário real do arquivo
  baixado (contagem/ordem de páginas via `pdf-lib`, texto extraído via
  `pdfjs-dist`, entradas de `.zip` via `jszip`) — não só nome de arquivo ou
  elementos na tela. O workflow `web-tests.yml` do GitHub Actions continua
  sendo a fonte de verdade formal para CI (esse workaround de sandbox não
  está automatizado lá), mas os resultados aqui são execuções reais, não
  suposição.

  Essa execução real revelou e permitiu corrigir bugs genuínos e
  pré-existentes que nenhuma rodada anterior havia detectado, entre eles:
  um `MediaBox` de 200×200pt nos PDFs sintéticos de teste
  (`shared/test-fixtures/generate.mjs`) que causava truncamento silencioso
  de texto no `pdfjs-dist` sempre que a posição estimada de um glifo
  ultrapassava a borda da página (corrigido para tamanho A4); um bug
  intermitente de `compress.spec.ts` em que `Buffer.from(base64)` às vezes
  devolvia uma view dentro do pool interno de 8 KB do Node com
  `byteOffset != 0`, e o `JpegEmbedder` do pdf-lib lê `imageData.buffer`
  ignorando esse offset — corrigido copiando para um `ArrayBuffer` próprio
  via `slice()`, confirmado estável com `--repeat-each=3`; e um
  `require()` usado dentro de um arquivo de teste ESM
  (`ocr.spec.ts`), que sempre quebrava o único teste que reabria o
  resultado real do OCR — corrigido usando o `readFileSync` já importado.

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
