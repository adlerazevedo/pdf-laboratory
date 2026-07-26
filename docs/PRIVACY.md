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
  `localStorage`, nem em IndexedDB (que é usado apenas para estado técnico
  temporário, nunca para o conteúdo de um PDF).
- Você pode verificar isso você mesmo: abra as Ferramentas do Desenvolvedor
  do navegador, aba "Rede" (Network), carregue um PDF e execute qualquer
  operação — nenhuma requisição deverá conter o conteúdo do seu arquivo.
- Quando uma funcionalidade futura precisar baixar um componente adicional
  (por exemplo, um modelo de idioma para OCR via Tesseract.js), isso será
  claramente identificado como "baixando um componente do aplicativo" — o
  que é diferente de "enviando o seu documento".
- Um botão "Limpar sessão" permite descartar imediatamente todos os arquivos
  carregados na memória do navegador.

## O que NÃO fazemos (em nenhuma das duas versões)

- Não coletamos nem transmitimos o conteúdo dos seus documentos.
- Não exigimos criação de conta nem login.
- Não compartilhamos dados com terceiros — porque não coletamos dados para
  começar.

## Dúvidas ou preocupações

Consulte também `SECURITY.md` para o processo de reporte de vulnerabilidades.
