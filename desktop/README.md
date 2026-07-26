# PDF Laboratory — Desktop

Aplicativo desktop local e offline para manipulação de PDFs, escrito inteiramente
em um único arquivo Python: [`PDF_Laboratory.py`](./PDF_Laboratory.py).

**Versão:** 1.7.0
**SHA-256:** `32fb44e966f56975c0e970fb52cbb9123290fcbf57464b80c59cd7bdfd6f7a53`

## Executando

```bash
pip install PySide6 pypdf pypdfium2 Pillow pydantic platformdirs psutil
python PDF_Laboratory.py
```

Modos de linha de comando (sem interface gráfica):

```bash
python PDF_Laboratory.py --diagnostico
python PDF_Laboratory.py --self-test
```

## Dependências obrigatórias

| Pacote | Licença |
|---|---|
| PySide6 | LGPLv3 |
| pypdf | BSD-3-Clause |
| pypdfium2 | BSD-3-Clause / Apache-2.0 (dual) |
| Pillow | HPND |
| pydantic | MIT |
| platformdirs | MIT |
| psutil | BSD-3-Clause |

## Ferramentas externas opcionais (nunca instaladas automaticamente)

| Ferramenta | Licença | Usada para |
|---|---|---|
| Ghostscript | AGPLv3 (subprocesso) | Otimização/compressão avançada |
| LibreOffice | MPL-2.0 (subprocesso) | Conversão Word/Excel/PowerPoint ↔ PDF |
| Tesseract | Apache-2.0 (subprocesso) | OCR |
| OCRmyPDF | MPL-2.0 (subprocesso) | Orquestração de OCR |
| qpdf | Apache-2.0 (subprocesso) | Reparo/verificação estrutural |
| pyHanko | MIT (biblioteca Python) | Assinatura digital criptográfica |

Nota de segurança de licenciamento: ferramentas acima invocadas via subprocesso
(binário externo separado) ou bibliotecas Python importadas dinamicamente via
pip não obrigam o código deste projeto a adotar a licença da dependência —
ver `THIRD_PARTY_NOTICES.md` na raiz do repositório para a análise completa.

## Privacidade

Processamento realizado localmente neste computador. Quando ferramentas
externas (Ghostscript, LibreOffice, Tesseract, qpdf) são usadas, elas também
rodam localmente, como processo separado — nenhum dado é enviado pela internet.

Ver `../docs/LIMITATIONS.md` para limitações conhecidas.
