# Limitações conhecidas

Este documento existe para que ninguém seja surpreendido pelo que o projeto
**não** faz. Ver também `docs/COMPATIBILITY.md` para a tabela completa por
ferramenta.

## Web — o que ainda não existe

- **OCR** foi implementado e testado (unitário + end-to-end com Playwright
  usando reconhecimento real de texto, ver `web/tests-e2e/ocr.spec.ts`),
  via Tesseract.js. Limitações reais e deliberadas: (1) qualidade e
  velocidade inferiores ao OCRmyPDF do aplicativo desktop; (2) na primeira
  execução de cada idioma (PT/EN), o navegador precisa baixar o motor WASM
  e o modelo de idioma de `cdn.jsdelivr.net` — isso exigiu abrir uma
  exceção pontual na Content Security Policy do site (documentada em
  `docs/SECURITY.md`), já que por padrão nenhuma requisição de rede além da
  própria origem é permitida; (3) o texto reconhecido é sobreposto de forma
  invisível (opacidade 0) sobre o conteúdo original — a página nunca é
  rasterizada/substituída, então a aparência visual não muda, só passa a
  ser pesquisável/selecionável; (4) o posicionamento do texto invisível
  segue a caixa delimitadora (bounding box) de cada palavra reconhecida
  pelo Tesseract.js, então pode não alinhar pixel-a-pixel com o texto
  visível em todos os casos — isso não afeta a busca, só a precisão da
  seleção manual de texto.
- **Assinatura visual (carimbo)** foi implementada e testada (unitário +
  end-to-end com Playwright, incluindo o modo de desenho à mão via canvas,
  ver `web/tests-e2e/visual-signature.spec.ts`). É estritamente visual: sem
  validade jurídica ou criptográfica, e a interface nunca solicita nem
  processa certificados PFX/P12 — o tipo `VisualSignatureOptions` nem
  possui esse campo.
- **Compressão básica** foi implementada e testada (unitário + end-to-end
  com Playwright, ver `web/tests-e2e/compress.spec.ts`), mas com limitações
  reais e deliberadas: só recomprime imagens já embutidas com filtro
  DCTDecode (JPEG); não toca fontes, texto ou vetores; por segurança, pula
  imagens com máscara de transparência (SMask), array `Decode` customizado,
  ou espaço de cor diferente de DeviceRGB/DeviceGray (evita risco de
  corromper cores ou perder transparência). Não garante redução de tamanho:
  um documento sem imagens JPEG, ou já bem otimizado, pode não encolher — e
  a resserialização do pdf-lib pode até aumentar levemente o arquivo nesse
  caso. A interface mostra o tamanho antes/depois com honestidade, inclusive
  quando não há redução.
- **Organizar páginas**, **imagens → PDF** e **PDF → imagens** foram
  implementados e testados (unitário + end-to-end com Playwright, ver
  `web/tests-e2e/`) nesta versão. Limitação conhecida de "Organizar páginas":
  se o usuário excluir todas as páginas, a interface bloqueia o botão
  "Salvar" com uma mensagem explícita — não é possível gerar um PDF de 0
  páginas (descoberta real ao testar: o pdf-lib normaliza um documento vazio
  para 1 página em branco ao reabri-lo, então a interface nunca confia nesse
  caso silenciosamente).
- Não há suporte a arquivos protegidos por senha (a versão web detecta e
  informa esse caso, mas não solicita/valida a senha ainda).
- Testes end-to-end (Playwright) foram de fato executados neste ambiente
  (não só escritos): o Chromium headless do sandbox faltava uma biblioteca
  de sistema (`libXdamage.so.1`) e não havia acesso root para instalar via
  `apt`/`playwright install-deps`; o pacote `.deb` já havia sido baixado em
  `/tmp` por uma tentativa anterior, então foi extraído localmente com
  `dpkg-deb -x` (sem privilégio de root) e apontado via `LD_LIBRARY_PATH` só
  para os processos de teste — nenhuma alteração de sistema. Com isso, toda a
  suíte (`home`, `organize`, `split`, `images-to-pdf`, `pdf-to-images`,
  `compress`, `visual-signature`, `web-desktop`) rodou de verdade contra um
  build de produção real. Esse workaround não está automatizado no
  `web-tests.yml` do GitHub Actions, que segue sendo a fonte de verdade para
  CI — mas os resultados aqui já são execuções reais, não suposição. Essa
  execução real revelou e permitiu corrigir bugs genuínos e pré-existentes
  que nenhuma rodada anterior havia detectado: seletores Playwright ambíguos
  (o mesmo texto de botão aparece na barra lateral e no cartão da tela
  inicial) quebravam 100% dos testes de `organize`, `images-to-pdf`,
  `pdf-to-images` e `split` — 14 testes ao todo, corrigidos com locators mais
  específicos (`.first()` ou texto mais distintivo); e uma violação real de
  acessibilidade crítica no componente compartilhado `DropZone` (o `<input
  type="file">` oculto não tinha nome acessível), agora corrigida com
  `aria-label`, o que também beneficia toda ferramenta que usa esse
  componente. Uma falha isolada e ainda não diagnosticada permanece em
  `compress.spec.ts` (1 de 3 testes, o de acessibilidade): o mesmo trecho de
  código de geração de PDF de teste (`writeFixture`) falha de forma
  determinística quando executado em Node puro, fora do runner do
  Playwright, mas passa de forma determinística dentro dele — indício de uma
  diferença de resolução de módulo (`pdf-lib`) entre os dois contextos ainda
  não identificada. Não afeta o motor de compressão em si (os outros 2
  testes do mesmo arquivo, que exercitam o motor de verdade, passam), e não
  foi investigado mais a fundo por estar fora do escopo desta fase.

## Web — o que nunca vai existir (por design, não por falta de tempo)

Estas funcionalidades dependem de binários nativos ou de material sensível
que nunca deve entrar em um navegador. Permanecerão exclusivas do desktop:

- Otimização avançada via Ghostscript.
- Conversão fiel Word/Excel/PowerPoint ↔ PDF via LibreOffice.
- Assinatura digital criptográfica com certificado PFX/P12 (ICP-Brasil).
- Reparo avançado de arquivos corrompidos via qpdf.
- Redação (censura) definitiva e irreversível de conteúdo sensível.

Se uma dessas funcionalidades se tornar essencial para a versão web no
futuro, a solução correta **não** é reimplementá-la de forma incompleta no
navegador — é propor um serviço de backend dedicado, com uma análise
explícita de tecnologia, hospedagem, custo, retenção de dados, criptografia,
privacidade e risco, sujeita a aprovação explícita antes de qualquer
implementação.

## Web — exclusivo do desktop por enquanto (não por design permanente)

Diferente da lista acima, estas três ferramentas não têm nenhum impedimento
técnico definitivo para rodar no navegador — apenas ainda não têm um motor
equivalente construído aqui. Estão corretamente identificadas na interface
como "Disponível no aplicativo desktop" (nunca como botão ativo falso), e a
distinção entre as duas categorias é explicada na página "Web × Desktop"
dentro do próprio aplicativo (acessível pela barra lateral):

- Marcadores/bookmarks (listar, adicionar, remover).
- Comparação de documentos página a página.
- Inspeção técnica da estrutura interna do PDF (versão, criptografia,
  formulários, JavaScript embutido, imagens e anexos).

## Desktop — limitações conhecidas

- Alguns painéis ainda exigem rolagem interna para alcançar o botão de ação
  principal em telas menores (ex.: Otimizar PDF).
- Não há um modo de barra lateral compacta.
- Não há atalho de teclado dedicado para alternar entre tema claro e escuro.

## Compromisso de honestidade

Nunca declaramos uma funcionalidade como "implementada" sem código real por
trás, nem "testada" sem execução real, nem "publicada" sem uma URL
publicamente acessível confirmada.
