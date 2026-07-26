# PDF Laboratory — Web

Aplicativo web para manipulação de PDFs, executado inteiramente no
navegador — sem backend, sem upload de documentos. Versão atual: `0.1.0`
(ver `package.json`), ainda não publicada publicamente (ver `README.md` na
raiz do repositório). Ver a documentação completa em
[`../docs/WEB.md`](../docs/WEB.md), [`../docs/PRIVACY.md`](../docs/PRIVACY.md)
e [`../docs/COMPATIBILITY.md`](../docs/COMPATIBILITY.md).

## Ferramentas implementadas

9 completas (unir, dividir, organizar páginas, extrair páginas, imagens →
PDF, PDF → imagens, marca d'água, numeração de páginas, metadados) e 3
parciais com limitações reais documentadas (OCR, assinatura visual,
compressão básica). Lista completa e classificação em
`src/data/tools.ts`; detalhe ferramenta por ferramenta em
`../docs/COMPATIBILITY.md`.

## Desenvolvimento

```bash
npm ci
npm run dev
```

## Scripts

- `npm run dev` — servidor de desenvolvimento
- `npm run build` — checagem de tipos + build de produção
- `npm run preview` — serve o build localmente
- `npm run lint` / `npm run typecheck`
- `npm run test` — Vitest (unidade/componente)
- `npm run test:e2e` — Playwright + axe-core (requer `npx playwright install`)
- `npm run fixtures:generate` — gera PDFs sintéticos de teste

## Testes

- **Unitário/componente (Vitest):** 67 testes.
- **End-to-end (Playwright + axe-core):** 16 arquivos de spec, 68 testes —
  cada ferramenta (incluindo verificação real do conteúdo binário
  baixado via `pdf-lib`/`pdfjs-dist`/`jszip`, não só nome de arquivo),
  tela inicial, página "Web × Desktop", layout responsivo/acessibilidade
  (WCAG) e PWA/caminho-base. Todos executados de verdade neste ambiente
  de desenvolvimento contra um build de produção real — não apenas
  escritos. Ver `../docs/WEB.md` para o relato completo, incluindo os
  workarounds de sandbox necessários e os bugs reais encontrados e
  corrigidos ao longo do processo.

## PWA e caminho-base

Instalável, com atualização controlada (`registerType: "prompt"` — nunca
silenciosa) e cache restrito aos arquivos da própria aplicação. Quando
publicado sob um sub-caminho (ex.: GitHub Pages,
`/pdf-laboratory/`), o `base` do Vite é ajustado automaticamente em builds
de produção/CI — ver `vite.config.ts`.
