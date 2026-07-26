# Política de Segurança

## Reportando uma vulnerabilidade

Se você encontrar uma vulnerabilidade de segurança neste projeto (desktop ou
web), por favor **não** abra um issue público. Em vez disso, envie um relatório
diretamente ao mantenedor descrevendo:

- Versão afetada (desktop ou web) e, se possível, o commit/tag.
- Passos para reproduzir.
- Impacto potencial.

Você receberá uma confirmação de recebimento e, sempre que possível, uma
estimativa de prazo para correção. Vulnerabilidades confirmadas serão
corrigidas antes de qualquer divulgação pública.

## Escopo de segurança por versão

### Desktop (`desktop/PDF_Laboratory.py`)

- Processa arquivos localmente; não faz upload de documentos para nenhum servidor.
- Pode invocar ferramentas externas instaladas pelo usuário (Ghostscript,
  LibreOffice, Tesseract, qpdf) via subprocesso — nunca instaladas automaticamente
  sem consentimento.
- Certificados de assinatura digital (PFX/P12) são lidos apenas localmente e
  nunca armazenados nem transmitidos pelo aplicativo.

### Web (`web/`)

- Todo o processamento de PDF ocorre no navegador (memória, Web Workers,
  IndexedDB apenas para estado temporário). Não existe backend nesta versão.
- Nenhum PDF do usuário é enviado a qualquer servidor, serviço de terceiros ou
  endpoint de telemetria.
- Todo arquivo carregado é tratado como entrada não confiável: a assinatura
  mágica é validada antes da leitura (não confiamos apenas na extensão `.pdf`),
  e o parser (`pdf.js`) roda com pré-busca/streaming de rede desativados.
- Content Security Policy restritiva (sem `eval`, sem scripts inline arbitrários,
  sem conexões de rede além da própria origem).
- Dependências têm versões fixadas e são varridas por Dependabot/CodeQL.

## Fora do escopo

- Ataques que exigem acesso físico ao computador do usuário.
- Vulnerabilidades em dependências de terceiros já reportadas publicamente e
  aguardando correção upstream (reporte diretamente ao projeto de origem).
