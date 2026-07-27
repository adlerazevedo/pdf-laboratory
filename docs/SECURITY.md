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
  `object-src 'none'`, `frame-ancestors 'none'`. Por padrão, `script-src` e
  `connect-src` são `'self'` (nenhum script de terceiro, nenhuma requisição
  de rede além da própria origem) — com uma única exceção deliberada e
  documentada abaixo, para a ferramenta de OCR.
- **Sem `eval`, sem HTML não sanitizado**: a interface não usa
  `dangerouslySetInnerHTML` nem interpola HTML a partir de conteúdo de
  arquivos.
- **Sem segredos no frontend**: não existem chaves de API nem tokens
  embutidos no código — não há backend para autenticar.
- **Dependências com versão fixada**, auditadas via `npm audit`, Dependabot
  (`.github/dependabot.yml`) e CodeQL (`.github/workflows/codeql.yml`) — ver
  `docs/CI.md` para a política de triagem e um passo manual de
  configuração necessário no CodeQL.
- **Worker de PDF isolado**: todo o processamento roda em um Web Worker
  (`src/workers/pdfWorker.ts`), limitando a superfície de um eventual bug de
  processamento em relação à thread principal da interface.
- **Service Worker restrito**: o cache do PWA (Workbox) inclui apenas
  `**/*.{js,css,html,svg,woff2}` — documentos do usuário nunca passam pelo
  cache do service worker.

### Exceção à CSP: motor de OCR (Tesseract.js) via CDN

A ferramenta de OCR usa Tesseract.js, que precisa baixar seu motor (WASM) e
os modelos de idioma (PT/EN) de `cdn.jsdelivr.net` na primeira execução de
cada idioma — não há como evitar essa rede sem hospedar ~10 MB de arquivos
binários dentro do próprio repositório (avaliado e adiado por ora). Por
isso, `script-src`, `connect-src` e `worker-src` incluem `cdn.jsdelivr.net`
como exceção **só para essa origem específica**, e `script-src` também
inclui `'wasm-unsafe-eval'` (exigido pelo navegador para compilar/instanciar
WebAssembly — diferente de `'unsafe-eval'`, não habilita `eval()`/
`Function()` de strings JavaScript arbitrárias).

O que isso implica, com honestidade:

- **O PDF do usuário nunca é enviado a essa CDN** — só o motor/modelo do
  Tesseract.js trafega por ali, nunca o conteúdo do documento sendo
  processado. Isso é verificável: `addSearchableTextLayer` (a função que
  recebe o texto reconhecido e monta o PDF final) roda inteiramente no
  Web Worker local, sem qualquer chamada de rede.
- **Isso introduz uma dependência de terceiro em tempo de execução.** Se
  `cdn.jsdelivr.net` estiver fora do ar, a ferramenta de OCR não funciona
  (as outras ferramentas continuam funcionando normalmente). Se a CDN fosse
  comprometida, um invasor poderia teoricamente servir um script malicioso
  sob esse domínio — um risco real de cadeia de suprimentos, mitigado pelo
  fato de que jsdelivr serve pacotes npm publicados e versionados (a versão
  exata do Tesseract.js/tesseract.js-core é fixada pelo `package.json`), mas
  não eliminado.
- Esta é a única exceção à política "tudo local" em toda a versão web —
  todas as outras 12 ferramentas continuam 100% offline após o carregamento
  inicial da página.

## Limitações conhecidas de segurança

- Esta versão web ainda não passou por uma auditoria de segurança externa
  formal. As medidas acima reduzem a superfície de ataque óbvia, mas não
  substituem uma revisão profissional dedicada.
- `npm audit` e CodeQL rodam automaticamente em CI, mas resultados devem ser
  revisados manualmente antes de cada release — nenhuma dessas ferramentas é
  tratada como garantia absoluta.
