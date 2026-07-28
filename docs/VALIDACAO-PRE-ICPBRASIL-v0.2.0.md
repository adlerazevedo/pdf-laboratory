# Validação pré-ICP-Brasil — PDF Laboratory v0.2.0 (Fases 5–8)

Commit avaliado: `a7a6854a5c072db69ce77eea3ab5d84f37ceb023`
Branch: `feat/pdf-editor-smart-forms-icpbrasil`
Data da execução: 2026-07-28

Este documento é o registro real e verificável da validação executada antes
de qualquer implementação criptográfica (Fase 9 — ICP-Brasil), cobrindo as
Fases 5 a 8: formulários AcroForm, detecção inteligente de campos,
preenchimento/flatten e assinatura visual expandida, além de todas as
funcionalidades anteriores do PDF Laboratory web.

**ICP-Brasil NÃO foi implementado nesta versão.** Nenhuma biblioteca
criptográfica foi adicionada. Nenhum certificado real foi usado em nenhum
momento.

## 1. Execução real (não simulada)

Todos os comandos abaixo foram executados nesta sessão, a partir de uma
instalação limpa (`rm -rf node_modules && npm ci`):

| Etapa | Comando | Resultado |
|---|---|---|
| Instalação limpa | `npm ci --no-audit --no-fund` | 538 pacotes, 12s, sem erros |
| Fixtures sintéticas | `npm run fixtures:generate` | 3 PDFs sintéticos gerados (1, 3, 10 páginas) |
| Typecheck | `tsc -b --force` | **0 erros** |
| Lint | `oxlint src` | **0 erros, 0 avisos** (69 arquivos, 97 regras) |
| Testes unitários | `vitest run` | **137/137 passaram** (14 arquivos) |
| Build de produção | `CI=true NODE_ENV=production npm run build` | sucesso, base `/pdf-laboratory/` |
| Testes e2e | `playwright test` (Chromium, build de produção, base `/pdf-laboratory/`) | **93/93 passaram** (22 arquivos de spec) |

Apenas o projeto Chromium está configurado em `playwright.config.ts` — não há
projetos Firefox/WebKit configurados nesta versão, então não foram
executados (nada foi omitido; a suíte inteira roda em todos os projetos
configurados).

### Evidência concreta da correção do worker do PDF.js (Etapa 2)

Antes da correção: `globPatterns` não incluía `.mjs`, e o precache do
Workbox tinha **12 entradas / 1670.58 KiB**, faltando o worker do pdf.js.

Depois da correção (`vite.config.ts` + `main.tsx`): o precache do build
gerado nesta validação tem **13 entradas / 3014.25 KiB**, confirmado tanto
pela saída do `vite build` quanto por 7 testes dedicados em
`tests-e2e/pwa-worker-integrity.spec.ts` (existência/unicidade do worker
`.mjs`, referência no bundle, inclusão no precache do `sw.js`, ausência de
hash de build anterior, integridade dos assets do `index.html`, e abertura
real de um PDF sintético na UI do build de produção).

## 2. Matriz funcional manual (documentos sintéticos, via UI real)

Cada linha abaixo corresponde a um teste Playwright que interage com a UI
real (upload de arquivo sintético, cliques, download real do resultado) e
valida estruturalmente o PDF/arquivo gerado (relendo os bytes reais com
`pdf-lib` e/ou `pdfjs-dist`, nunca apenas checando se um botão apareceu).

| Ferramenta | Entrada | Resultado esperado | Resultado real | Validação estrutural | Status |
|---|---|---|---|---|---|
| Unir PDFs | 2 PDFs sintéticos | Um PDF com o conteúdo de ambos, na ordem enviada; reordenar muda a ordem final | Conforme esperado | Reabertura com `pdf-lib`, conteúdo de cada página conferido | Aprovado |
| Dividir PDF | PDF sintético 10 páginas | 6 modos (cada página, intervalos, pares/ímpares, seleção, N arquivos) geram os arquivos/zip corretos | Conforme esperado | Contagem de páginas e distribuição verificadas por modo | Aprovado |
| Organizar páginas | PDF sintético | Miniaturas, rotação, duplicação, exclusão, página em branco, desfazer, salvar | Conforme esperado | Estrutura final revalidada; bloqueia salvar se todas as páginas forem excluídas | Aprovado |
| Extrair páginas | PDF sintético | Intervalo não contíguo extraído na ordem pedida; intervalo inválido bloqueia | Conforme esperado | Contagem e ordem de páginas confirmadas | Aprovado |
| Imagens → PDF | Imagens sintéticas | Página A4 paisagem preenchida; remover imagem reduz contagem | Conforme esperado | PDF resultante reaberto e validado | Aprovado |
| PDF → Imagens | PDF sintético | Exporta páginas selecionadas em PNG, .zip quando mais de uma | Conforme esperado | Intervalo inválido mostra erro claro | Aprovado |
| Marca d'água | PDF sintético | Texto sobreposto em todas as páginas, sem apagar conteúdo original | Conforme esperado | Botão desabilitado sem texto | Aprovado |
| Numeração de páginas | PDF sintético | "N / total" real e legível; início customizável | Conforme esperado | Texto extraído via pdf.js confere números exatos | Aprovado |
| Metadados | PDF sintético | Título/autor/assunto/palavras-chave gravados de verdade | Conforme esperado | Campos em branco não quebram o salvamento | Aprovado |
| OCR | Imagem sintética com texto | Reconhece texto real e gera camada pesquisável | Conforme esperado | Aviso de download de modelo visível antes de rodar; intervalo inválido bloqueia | Aprovado |
| Compressão | PDF com imagem JPEG | Reduz tamanho; PDF sem imagens não quebra, avisa que não houve redução | Conforme esperado | — | Aprovado |
| Redação segura | PDF sintético com CPF | Detecção automática de CPF, remoção real (não só cobertura visual) do texto na página marcada, outras páginas intactas | Conforme esperado | Texto extraído via pdf.js confirma ausência real | Aprovado |
| Editor direto de PDF | PDF sintético | Adiciona texto/retângulo, desfaz uma ação, salva; resultado reabre com o objeto restante | Conforme esperado | — | Aprovado |
| Ferramentas de página avançadas | PDF sintético | Numeração Bates + marcador realmente presentes no PDF resultante | Conforme esperado | — | Aprovado |
| **Criação de formulário AcroForm** | PDF sintético | Cria campo de texto obrigatório + checkbox marcado; ambos existem como AcroForm real | Conforme esperado | Nomes duplicados bloqueiam salvar e mostram aviso | Aprovado |
| **Detecção inteligente de campos** | PDF sintético com rótulos "Nome:"/"CPF:" | Sugestões a partir de rótulos reais; aceitar cria AcroForm de verdade | Conforme esperado | Aceitar/rejeitar sugestões testados | Aprovado |
| **Preenchimento de formulário** | PDF com AcroForm (texto, checkbox, combo, campo somente-leitura) | Preenche texto/checkbox/combo; campo somente-leitura nunca editável e permanece intacto; bloqueia salvar com campo obrigatório vazio | Conforme esperado | Reabertura confirma valores exatos | Aprovado |
| **Flatten (achatar)** | Formulário preenchido | Remove campos do AcroForm; valor preenchido continua visível/pesquisável na página | Conforme esperado | Texto extraído via pdf.js confirma presença; `getFields()` retorna vazio | Aprovado |
| **Assinatura visual (texto, desenho, âncora livre, rotação, timestamp)** | PDF sintético | Aplica carimbo visual (texto ou desenho) só nas páginas selecionadas; arrastar define âncora livre, "redefinir" volta ao preset; rotação aplicada sem erro; timestamp opcional anexado ao texto | Conforme esperado | Aviso "não é assinatura digital" sempre visível | Aprovado |
| **Reabrir PDFs gerados / seleção e busca de texto após flatten** | Todos os PDFs gerados acima | Reabrem normalmente; texto de campos achatados é selecionável/pesquisável | Conforme esperado | Confirmado via extração de texto real (pdf.js) em múltiplas specs | Aprovado |
| Atualização do PWA | Build de produção servido | Novo service worker é ativado de verdade (`updateSW(true)`), não apenas um reload sob o SW antigo | Conforme esperado | 7 testes dedicados em `pwa-worker-integrity.spec.ts` | Aprovado |
| **Funcionamento offline após primeiro carregamento** | Build de produção, rede real bloqueada (`context.setOffline(true)`) após 1º load | App recarrega e permite navegar para uma ferramenta totalmente offline | Conforme esperado | Teste dedicado adicionado nesta validação (`pwa.spec.ts`) | Aprovado |
| Limpeza de sessão | — | Nenhum documento do usuário é persistido entre sessões (arquitetura 100% em memória; único uso de `localStorage` é preferência de tema claro/escuro) | Conforme esperado | Confirmado por auditoria de código (ver seção 3) — não há API para "limpar sessão" porque não há nada persistido para limpar | Aprovado |
| Ferramenta ICP-Brasil (assinatura digital) | — | Aparece desabilitada, título "— Em desenvolvimento", nunca aceita certificado, nunca simula operação criptográfica | Conforme esperado | Botão desabilitado (`disabled` no React), inalcançável via clique; `limitationNote` explícito | **NÃO IMPLEMENTADO (por desenho)** |
| Acessibilidade (axe-core) | Todas as telas acima | Sem violações críticas | Conforme esperado | `AxeBuilder` incluído em cada spec relevante | Aprovado |
| Responsividade (5 breakpoints) | Home, gaveta mobile, cabeçalho 375px | Sidebar fixa em telas largas; vira gaveta em telas estreitas; Escape/backdrop fecham; nenhum elemento estoura a viewport em 375px | Conforme esperado | 8 testes dedicados em `responsive.spec.ts` | Aprovado |

Total: **93 testes e2e passaram**, cobrindo 22 arquivos de spec, todos contra
o build de produção real servido em `/pdf-laboratory/` (mesmo sub-caminho do
GitHub Pages).

## 3. Segurança e privacidade (Etapa 6)

Auditoria de código realizada sobre o commit `a7a6854`:

- **PDFs nunca enviados a servidores**: nenhuma chamada `fetch`/`axios`/
  `XMLHttpRequest` em `src/` além do carregamento do motor/modelos WASM do
  Tesseract.js a partir de `cdn.jsdelivr.net` (declarado e restrito via CSP
  `connect-src`) — esse carregamento nunca inclui conteúdo de documentos do
  usuário, apenas o próprio motor de OCR.
- **Nenhuma chamada externa com conteúdo de documento**: confirmado pela
  mesma varredura; a aplicação não tem backend.
- **Conteúdo de documento nunca aparece em logs**: nenhuma ocorrência de
  `console.log/warn/error` imprimindo bytes de PDF ou conteúdo de formulário
  em `src/`.
- **Nenhum armazenamento permanente de documentos**: único uso de
  `localStorage` em todo o `src/` é a preferência de tema (`theme.ts`); não
  há uso de `indexedDB` ou `sessionStorage` em nenhum lugar do código-fonte.
- **Fixtures são sintéticas**: geradas localmente por
  `shared/test-fixtures/generate.mjs`, sem nenhum documento real.
- **Nenhum certificado ou senha real incluído**: varredura por
  `BEGIN CERTIFICATE`/`BEGIN PRIVATE KEY`/`BEGIN RSA` no repositório inteiro
  não encontrou nenhuma ocorrência; as únicas menções a `.pfx`/`.p12` são
  referências de formato em `.gitignore`, documentação e no texto explicativo
  da ferramenta desktop-only — nunca um arquivo de certificado real.
- **CSP permanece válida**: `index.html` mantém uma
  `Content-Security-Policy` restritiva (`default-src 'self'`, sem
  `unsafe-eval`, `object-src 'none'`, `frame-ancestors 'none'`), com a única
  exceção documentada de `cdn.jsdelivr.net` para o motor WASM do Tesseract.js.
- **Dependências e licenças documentadas**: `THIRD_PARTY_NOTICES.md` lista
  as 6 dependências de runtime da web (`react`, `react-dom`, `pdf-lib`,
  `pdfjs-dist`, `jszip`, `tesseract.js`) e as ferramentas de
  build/teste/lint, todas com suas licenças.

## 4. Estado por item (conforme exigido)

| Item | Status |
|---|---|
| Formulários (AcroForm) | **Validado** |
| Detecção inteligente de campos | **Validado** |
| Preenchimento de formulário | **Validado** |
| Flatten | **Validado** |
| Assinatura visual | **Validado** |
| PWA | **Validado** |
| Worker do PDF.js | **Validado** |
| ICP-Brasil | **NÃO IMPLEMENTADO** |
| Certificado real | **NÃO UTILIZADO** |

## 5. Limitações conhecidas

- Apenas o navegador Chromium é testado via Playwright nesta versão (nenhum
  projeto Firefox/WebKit configurado).
- OCR e assinatura digital ICP-Brasil real permanecem apenas no aplicativo
  desktop (OCR via Tesseract binário; assinatura via pyHanko) — a versão web
  não replica certificação real.
- A ferramenta "Assinatura digital (ICP-Brasil)" nesta versão web é apenas um
  placeholder desabilitado — não deve ser confundida com uma implementação
  parcial.
