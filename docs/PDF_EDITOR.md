# Editor de PDF (ferramenta "Editar PDF")

Ferramenta web que permite adicionar texto, imagens, formas (retângulo,
elipse, linha) e links diretamente sobre as páginas de um PDF existente,
com desfazer/refazer, seleção múltipla, alinhamento/distribuição, grade e
zoom. Todo o processamento acontece localmente no navegador (pdf-lib +
pdf.js); nenhum arquivo é enviado a um servidor.

## O que esta ferramenta FAZ

- Renderiza cada página como imagem (via pdf.js) e permite posicionar
  novos objetos sobre ela.
- Ao salvar, usa o pdf-lib para **compor** esses novos objetos sobre o
  PDF original (`drawText`, `drawImage`, `drawRectangle`/`drawSvgPath`,
  `drawEllipse`, `drawLine`, anotação `Link`), gerando um novo arquivo.
  O arquivo original carregado nunca é modificado — apenas mantido em
  memória.
- Suporta desfazer/refazer (histórico completo de todas as ações),
  duplicar, copiar/colar, atalhos de teclado (Delete, Ctrl+Z/Y, Ctrl+D,
  Ctrl+C/V, setas para mover), alinhar e distribuir múltiplos objetos
  selecionados, grade com "snap" opcional, e zoom de 50% a 200%.

## O que esta ferramenta NÃO faz (limitação técnica real, não um bug)

- **Não reescreve texto já existente no PDF.** Um PDF é, na prática, uma
  sequência de operadores gráficos (`Tj`/`TJ` posicionando glifos) — não
  um documento de texto editável como um `.docx`. Não existe, de forma
  genérica e para qualquer PDF, uma operação segura de "localizar este
  texto no fluxo de conteúdo e substituir por outro" quando a fonte é
  desconhecida, subconjuntada (subsetted) ou Type0/CID. Esta ferramenta
  **adiciona um NOVO objeto de texto por cima** — não localiza nem
  substitui glifos existentes.
- Por isso, cobrir uma área com um retângulo e desenhar texto novo por
  cima é uma **cobertura visual**, não uma exclusão do conteúdo
  subjacente: o texto original continua presente no arquivo e continua
  extraível por qualquer ferramenta de extração de texto. Para remoção
  real e definitiva de conteúdo sensível, use a ferramenta separada
  **"Redação segura"** (que reprocessa o PDF removendo o conteúdo, não
  apenas cobrindo-o visualmente).
- **Páginas com `/Rotate` diferente de 0 no PDF original**: as
  coordenadas dos objetos adicionados são calculadas em relação ao
  `MediaBox` da página (o mesmo espaço de coordenadas que o pdf-lib
  expõe via `page.getWidth()`/`getHeight()`), sem compensar
  automaticamente uma rotação já gravada no PDF original. Na prática
  isto é raro (a maioria dos PDFs não usa `/Rotate`), mas é uma
  limitação conhecida, não testada nesta fase.
- **Redimensionamento com objeto rotacionado**: o cálculo compensa a
  rotação ao redimensionar (rotaciona o delta do ponteiro de volta para
  o referencial local do objeto antes de aplicar a mudança de
  largura/altura), mas não foi validado exaustivamente para todos os
  ângulos — ângulos comuns (0°, 90°, 180°, 270°) funcionam de forma
  confiável; ângulos arbitrários podem ter pequenas imprecisões visuais.

## Testes

- `web/src/lib/pdf/editorTypes.test.ts`: histórico de desfazer/refazer,
  alinhamento e distribuição (unidade, sem DOM).
- `web/src/lib/pdf/editorExport.test.ts`: geração real de PDF via
  pdf-lib — contagem de páginas preservada, fonte/XObject/anotação Link
  realmente presentes nos recursos da página, cancelamento, objetos em
  página inexistente.
- `web/tests-e2e/editor.spec.ts`: fluxo real em navegador — adiciona
  texto e retângulo, desfaz uma ação, salva, baixa o PDF resultante e
  confirma via pdf.js que o texto adicionado está de fato no conteúdo
  extraível da página (prova de que não é apenas visual); mais um teste
  de acessibilidade (axe-core, sem violações críticas).
