# Segurança — detalhes técnicos

Para o processo de reporte de vulnerabilidades, veja o `SECURITY.md` na raiz
do repositório. Este documento descreve as decisões técnicas de segurança.

## Modelo de ameaça

Em ambas as versões, **todo arquivo PDF/imagem fornecido pelo usuário é
tratado como entrada não confiável** — pode estar corrompido, malformado, ou
ser deliberadamente malicioso.

## Desktop

- Validação de arquivo antes do processamento; erros de parsing são
  capturados e mostrados como estado de erro, nunca travam a aplicação.
- Ferramentas externas (Ghostscript, LibreOffice, Tesseract, qpdf) são
  chamadas via subprocesso com argumentos explícitos (nunca via `shell=True`
  com entrada não sanitizada).
- Certificados de assinatura digital (PFX/P12) são lidos apenas para a
  operação de assinatura em si; a senha do certificado não é persistida.

## Web

- **Validação de assinatura mágica**: nunca confiamos apenas na extensão
  `.pdf` — os primeiros bytes do arquivo são comparados contra a assinatura
  `%PDF-` real antes de qualquer processamento (`src/lib/pdf/validation.ts`).
- **pdf.js configurado defensivamente**: `disableAutoFetch: true`,
  `disableStream: true` — impede que um PDF malicioso dispare requisições de
  rede automáticas ao ser aberto.
- **Content Security Policy restritiva** (`index.html`): sem `unsafe-eval`,
  sem scripts de terceiros, `connect-src 'self'` (nenhuma requisição de rede
  além da própria origem), `object-src 'none'`, `frame-ancestors 'none'`.
- **Sem `eval`, sem HTML não sanitizado**: a interface não usa
  `dangerouslySetInnerHTML` nem interpola HTML a partir de conteúdo de
  arquivos.
- **Sem segredos no frontend**: não existem chaves de API nem tokens
  embutidos no código — não há backend para autenticar.
- **Dependências com versão fixada**, auditadas via `npm audit`, Dependabot
  (`.github/dependabot.yml`) e CodeQL (`.github/workflows/codeql.yml`).
- **Worker de PDF isolado**: todo o processamento roda em um Web Worker
  (`src/workers/pdfWorker.ts`), limitando a superfície de um eventual bug de
  processamento em relação à thread principal da interface.
- **Service Worker restrito**: o cache do PWA (Workbox) inclui apenas
  `**/*.{js,css,html,svg,woff2}` — documentos do usuário nunca passam pelo
  cache do service worker.

## Limitações conhecidas de segurança

- Esta versão web ainda não passou por uma auditoria de segurança externa
  formal. As medidas acima reduzem a superfície de ataque óbvia, mas não
  substituem uma revisão profissional dedicada.
- `npm audit` e CodeQL rodam automaticamente em CI, mas resultados devem ser
  revisados manualmente antes de cada release — nenhuma dessas ferramentas é
  tratada como garantia absoluta.
