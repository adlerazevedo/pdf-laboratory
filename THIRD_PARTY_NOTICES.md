# Avisos de Terceiros (THIRD_PARTY_NOTICES)

Este documento lista as dependências de terceiros usadas pelo PDF Laboratory
(desktop e web) e suas respectivas licenças. **Isto não é aconselhamento
jurídico** — em caso de dúvida sobre compatibilidade de licenças, consulte um
profissional qualificado.

## Desktop — dependências Python obrigatórias

| Pacote | Licença |
|---|---|
| PySide6 | LGPLv3 |
| pypdf | BSD-3-Clause |
| pypdfium2 | BSD-3-Clause / Apache-2.0 (dual), docs CC-BY-4.0 |
| Pillow | HPND |
| pydantic | MIT |
| platformdirs | MIT |
| psutil | BSD-3-Clause |

## Desktop — ferramentas externas opcionais (subprocesso, nunca importadas estaticamente)

| Ferramenta | Licença |
|---|---|
| Ghostscript | AGPLv3 |
| LibreOffice (soffice) | MPL-2.0 |
| Tesseract | Apache-2.0 |
| OCRmyPDF | MPL-2.0 |
| qpdf | Apache-2.0 |
| pyHanko | MIT |

### Nota sobre segurança de licenciamento

A invocação via subprocesso de binários externos instalados separadamente
pelo usuário (Ghostscript, LibreOffice, Tesseract, qpdf), e a importação
dinâmica de pacotes Python instalados via pip (incluindo os LGPL, como
PySide6), não exigem que o código deste projeto adote a licença da
dependência chamada/importada. Isso é diferente de vincular estaticamente
código copyleft ao binário do próprio projeto.

## Web — dependências planejadas/usadas

| Pacote | Licença |
|---|---|
| React / react-dom | MIT |
| Vite | MIT |
| TypeScript | Apache-2.0 |
| pdfjs-dist (PDF.js) | Apache-2.0 |
| pdf-lib | MIT |
| JSZip | MIT / GPLv3 (dual, usamos sob MIT) |
| Tesseract.js (planejado) | Apache-2.0 |
| Vitest | MIT |
| @testing-library/* | MIT |
| Playwright | Apache-2.0 |
| axe-core | MPL-2.0 |
| vite-plugin-pwa | MIT |

## Licença deste repositório

MIT (ver `LICENSE`) — compatível com todas as dependências obrigatórias
identificadas acima, dado que nenhuma delas é vinculada estaticamente ao
código deste projeto.
