# Compatibilidade desktop × web

Legenda: **Completo** (implementado e funcional) · **Parcial** (implementado
com limitações reais, descritas na coluna de notas) · **—** (indisponível
nesta versão; nunca aparece como botão ativo falso).

| Ferramenta | Desktop | Web | Notas |
|---|---|---|---|
| Unir PDFs | Completo | Completo | |
| Dividir PDF | Completo | Completo | |
| Extrair páginas | Completo | Completo | |
| Marca d'água | Completo | Completo | |
| Numeração de páginas | Completo | Completo | |
| Metadados simples | Completo | Completo | |
| Organizar páginas (reordenar/girar/duplicar/excluir/inserir em branco) | Completo | — | Motor já implementado em `web/src/lib/pdf/operations.ts`; falta a interface de arrastar-e-soltar com miniaturas |
| Imagens → PDF | Completo | — | Motor implementado (`imagesToPdf`); falta interface |
| PDF → imagens | Completo | — | Motor implementado (`thumbnails.ts`); falta interface e empacotamento em .zip |
| Compressão/otimização básica | — | — | Web: planejada como nível "limitada"; ainda não implementada |
| OCR (texto pesquisável) | Completo (OCRmyPDF + Tesseract) | — | Web: planejado via Tesseract.js em Web Worker; ainda não implementado |
| Assinatura visual (carimbo) | Completo | — | Web: planejada como nível "limitada"; ainda não implementada |
| Otimização avançada (Ghostscript) | Completo | — | Depende de binário instalado localmente; exclusivo do desktop |
| Conversão Word/Excel/PowerPoint ↔ PDF | Completo (via LibreOffice) | — | Depende de binário instalado localmente; exclusivo do desktop |
| Assinatura digital (ICP-Brasil, PFX/P12) | Completo (via pyHanko) | — | Certificados PFX/P12 nunca devem ser carregados em um navegador; exclusivo do desktop |
| Redação segura e definitiva | Completo (via qpdf) | — | Exige reprocessamento profundo do arquivo; exclusivo do desktop |
| Reparo avançado de arquivos corrompidos | Completo (via qpdf) | — | Exclusivo do desktop |
| Inspeção de estrutura interna do PDF | Completo | — | Exclusivo do desktop |
| Marcadores/bookmarks | Completo | — | Exclusivo do desktop nesta versão |
| Comparação de documentos | Completo | — | Exclusivo do desktop nesta versão |

## Sobre a coluna "Web"

A versão web é construída em cima de um motor de PDF (`web/src/lib/pdf/`) que
já implementa mais operações do que a interface atualmente expõe — algumas
ferramentas listadas como "—" já têm a lógica pronta e testada
(`operations.test.ts`), mas ainda não têm uma tela dedicada. Isso é
declarado explicitamente para não superestimar o estado do projeto: uma
função existir no motor não significa que a ferramenta esteja disponível
para o usuário final.
