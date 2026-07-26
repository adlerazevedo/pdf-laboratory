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
  desenvolvimento — 21 testes, todos passando (`operations.ts`, `validation.ts`,
  `parseRanges.ts`, `HomeScreen.tsx`).
- **Lint (`oxlint`) e checagem de tipos (`tsc -b`):** executados neste
  ambiente — sem erros.
- **Build de produção (`vite build`):** executado neste ambiente — sucesso,
  incluindo geração do service worker e do manifesto PWA.
- **Playwright + axe-core (E2E/acessibilidade):** os testes foram
  **escritos e configurados** (`web/tests-e2e/home.spec.ts`), mas **não foi
  possível executá-los no ambiente de desenvolvimento usado para construir
  este projeto**, porque o sandbox não tem permissão para instalar as
  bibliotecas de sistema do Chromium (`libXdamage`, etc.) sem privilégios de
  root. Eles rodam automaticamente no workflow `web-tests.yml` em um runner
  do GitHub Actions com privilégios completos. **Não afirme que os testes E2E
  passaram até que o workflow correspondente tenha rodado com sucesso no
  GitHub.**

## Limites de desempenho

- Miniaturas são renderizadas por página, sob demanda — nunca o documento
  inteiro de uma vez.
- Tamanho máximo de arquivo configurável (`MAX_FILE_SIZE_BYTES`, 200 MB por
  padrão) — arquivos maiores são rejeitados com uma mensagem clara.
- URLs de Blob são revogadas logo após o início do download
  (`URL.revokeObjectURL`).
