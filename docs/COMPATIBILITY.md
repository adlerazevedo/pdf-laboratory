# Compatibilidade desktop × web

Legenda: **Completo** (implementado e funcional) · **Parcial** (implementado
com limitações reais, descritas na coluna de notas) · **—** (indisponível
nesta versão; nunca aparece como botão ativo falso).

| Ferramenta | Desktop | Web | Notas |
|---|---|---|---|
| Unir PDFs | Completo | Completo | |
| Dividir PDF | Completo | Completo | 6 modos: cada página, intervalos personalizados, a cada N páginas, dividir em N arquivos, pares/ímpares, extrair seleção; validação imediata, resumo visual das saídas, download em .zip (ou PDF único quando há apenas 1 saída) |
| Extrair páginas | Completo | Completo | |
| Marca d'água | Completo | Completo | |
| Numeração de páginas | Completo | Completo | |
| Metadados simples | Completo | Completo | |
| Organizar páginas (reordenar/girar/duplicar/excluir/inserir em branco) | Completo | Completo | Miniaturas, arrastar-e-soltar, seleção múltipla, desfazer/refazer; nunca modifica o arquivo original |
| Imagens → PDF | Completo | Completo | Várias imagens, reordenação, tamanho de página, margem e ajuste conter/preencher |
| PDF → imagens | Completo | Completo | Seleção de páginas, PNG/JPEG, resolução (DPI), qualidade JPEG, download individual ou em .zip |
| Compressão/otimização básica | — | Parcial | Web: recomprime apenas imagens JPEG (DCTDecode) já embutidas no PDF, em 3 níveis (leve/média/forte); não toca fontes, texto ou vetores; não garante redução (documentos sem JPEG, ou já otimizados, podem não encolher); imagens com transparência (SMask) ou espaço de cor não-RGB/escala de cinza são deixadas intactas por segurança |
| OCR (texto pesquisável) | Completo (OCRmyPDF + Tesseract) | — | Web: planejado via Tesseract.js em Web Worker; ainda não implementado |
| Assinatura visual (carimbo) | Completo | Parcial | Web: texto, desenho à mão (canvas) ou imagem PNG/JPEG; posição (9 opções), tamanho e opacidade ajustáveis; seleção de páginas (todas/primeira/intervalo); aviso explícito de que não é assinatura digital; nunca solicita PFX/P12 |
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
nesta tabela, ela tem uma tela real conectada ao motor, sem limitações
relevantes — não apenas a função existindo internamente. "Parcial" significa
que a tela e o motor existem e são reais, mas com limitações genuínas
descritas na coluna de notas (não é uma forma educada de dizer "incompleto").
Ferramentas ainda marcadas como "—" na coluna Web (OCR) têm apenas
planejamento ou motor parcial nesta fase; ver
`docs/LIMITATIONS.md` para o estado exato de cada uma.
