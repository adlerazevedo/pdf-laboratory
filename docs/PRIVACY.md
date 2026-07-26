# Privacidade

## Princípio geral

O PDF Laboratory foi desenhado para que **você nunca precise enviar seus
documentos a um servidor** para manipulá-los. Isso vale de formas diferentes
para cada versão:

## Desktop

"Processamento realizado localmente neste computador": o aplicativo lê e
grava arquivos apenas no seu sistema de arquivos. Quando uma funcionalidade
depende de um programa externo (Ghostscript, LibreOffice, Tesseract, qpdf),
esse programa também roda localmente, como um processo separado no seu
computador — nenhum dado é enviado pela internet nesse processo.
Evitamos deliberadamente a frase "nenhum arquivo sai do seu computador" de
forma absoluta quando ferramentas externas estão envolvidas, preferindo a
formulação mais precisa acima.

## Web

- Nenhum PDF, imagem ou dado extraído de um documento é enviado a qualquer
  servidor. Todo processamento ocorre em memória, no seu navegador, usando
  Web Workers.
- Não há telemetria, não há Google Analytics, não há pixels de rastreamento,
  por padrão.
- Não há armazenamento permanente de documentos — nem em disco, nem em
  `localStorage`, nem em IndexedDB. O código da própria aplicação nunca usa
  IndexedDB/localStorage para guardar um documento ou seu conteúdo. A única
  gravação em IndexedDB observada vem de dentro da biblioteca Tesseract.js
  (ferramenta de OCR), que cacheia o modelo de idioma já baixado para não
  precisar rebaixá-lo a cada execução — nunca o seu PDF.
- Você pode verificar isso você mesmo: abra as Ferramentas do Desenvolvedor
  do navegador, aba "Rede" (Network), carregue um PDF e execute qualquer
  operação — nenhuma requisição deverá conter o conteúdo do seu arquivo.
- **Exceção única e identificada**: a ferramenta de OCR baixa o motor
  Tesseract.js (WASM) e o modelo do idioma escolhido (PT ou EN) de
  `cdn.jsdelivr.net` na primeira execução de cada idioma — a interface
  avisa isso claramente antes de você clicar em "Executar OCR". É "baixando
  um componente do aplicativo", nunca "enviando o seu documento": o PDF
  continua inteiramente no seu navegador, e você pode confirmar isso na
  aba "Rede" das Ferramentas do Desenvolvedor — as únicas requisições
  externas visíveis durante o OCR são para arquivos do próprio Tesseract.js
  (motor e modelo), nunca para o conteúdo do seu PDF. Ver `docs/SECURITY.md`
  para os detalhes técnicos e riscos dessa exceção à política "tudo local".
- Um botão "Limpar sessão" permite descartar imediatamente todos os arquivos
  carregados na memória do navegador.

## O que NÃO fazemos (em nenhuma das duas versões)

- Não coletamos nem transmitimos o conteúdo dos seus documentos.
- Não exigimos criação de conta nem login.
- Não compartilhamos dados com terceiros — porque não coletamos dados para
  começar.

## Dúvidas ou preocupações

Consulte também `SECURITY.md` para o processo de reporte de vulnerabilidades.
