# Arquitetura

O PDF Laboratory é publicado como **um repositório, duas aplicações
independentes** que compartilham propósito e identidade visual, mas não
compartilham código de execução nem processo em tempo real.

```
pdf-laboratory/
├── desktop/          Aplicativo Python + PySide6 (arquivo único)
├── web/              Aplicativo React + TypeScript + Vite (SPA estático)
├── shared/
│   ├── branding/      Ativos de identidade visual (SVGs) usados por ambos
│   └── test-fixtures/ Gerador de PDFs sintéticos para testes
└── docs/              Esta documentação
```

## Por que dois códigos-fonte separados?

- O desktop depende de **PySide6 (Qt)** e, opcionalmente, de binários externos
  instalados no sistema operacional (Ghostscript, LibreOffice, Tesseract,
  qpdf, pyHanko) — nenhum deles roda dentro de um navegador.
- O GitHub Pages serve apenas **arquivos estáticos**; não existe servidor
  capaz de executar Python. Por isso a versão web é uma reimplementação em
  TypeScript, usando bibliotecas que rodam inteiramente no navegador
  (`pdf.js`, `pdf-lib`, `JSZip`, `Tesseract.js`).
- O motor de PDF do desktop e o motor de PDF do web **não** compartilham
  código-fonte — mantemos apenas a mesma terminologia e os mesmos nomes de
  tipos (`SimpleMetadata`, `PageState`, etc.) para reduzir a distância
  conceitual entre as duas bases.

## Desktop — visão geral

Arquivo único (`desktop/PDF_Laboratory.py`), organizado internamente em
seções (modelos, serviços, parsers, workers em thread, fila de tarefas,
sistema de design, telas). Detalhes em `docs/DESKTOP.md`.

## Web — visão geral

```
web/src/
├── lib/pdf/       Motor de PDF (pdf-lib + pdf.js), puro TypeScript, sem UI
├── workers/       Web Worker que executa o motor fora da thread principal
├── components/    Componentes de interface (App Shell, cartões, formulários)
│   └── tools/     Uma tela por ferramenta
├── data/          Catálogo de ferramentas e sua classificação de suporte
└── styles/        Tokens de design (cores, espaçamento) — espelham o desktop
```

Toda operação pesada (unir, dividir, aplicar marca d'água, etc.) roda dentro
de um **Web Worker** (`src/workers/pdfWorker.ts`), nunca na thread principal —
a interface permanece responsiva mesmo processando arquivos grandes.
Detalhes em `docs/WEB.md`.

## Paleta de cores compartilhada

| Papel | Claro | Escuro |
|---|---|---|
| Fundo | `#F5F7FA` | `#111619` |
| Superfície | `#FFFFFF` | `#192024` |
| Texto | `#182125` | `#EDF3F5` |
| Texto secundário | `#5F6B72` | `#AAB6BC` |
| Borda | `#DCE3E8` | `#303B41` |
| Destaque (accent) | `#147D82` | `#35A4A7` |
| Sucesso | `#27845A` | `#51AE7C` |
| Aviso | `#B7791F` | `#D7A84B` |
| Perigo | `#B83A3A` | `#E16969` |
| Info | `#356FA8` | `#6EA6D8` |

Ambas as aplicações implementam essa paleta de forma independente (QSS no
desktop, CSS custom properties no web) — não há um pacote de design
compartilhado em código, apenas a mesma especificação de valores.
