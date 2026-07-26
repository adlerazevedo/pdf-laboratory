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
| Organizar páginas (reordenar/girar/duplicar/excluir/inserir em branco) | Completo | Completo | Miniaturas, arrastar-e-soltar, seleção múltipla, desfazer/refazer; nunca modifica o arquivo original |
| Imagens → PDF | Completo | Completo | Várias imagens, reordenação, tamanho de página, margem e ajuste conter/preencher |
| PDF → imagens | Completo | Completo | Seleção de páginas, PNG/JPEG, resolução (DPI), qualidade JPEG, download individual ou em .zip |
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

A versão web é construída em cima de um motor de PDF (`web/src/lib/pdf/`)
independente da interface. Sempre que uma ferramenta aparece como "Completo"
nesta tabela, ela tem uma tela real conectada ao motor — não apenas a função
existindo internamente. Ferramentas ainda marcadas como "—" (compressão
básica, OCR, assinatura visual) têm apenas planejamento ou motor parcial;
ver `docs/LIMITATIONS.md` para o estado exato de cada uma.
