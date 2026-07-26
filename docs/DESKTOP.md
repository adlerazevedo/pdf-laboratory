# Aplicativo Desktop

`desktop/PDF_Laboratory.py` — versão 1.7.0, Python 3.11+, PySide6.

## Executando

```bash
cd desktop
pip install PySide6 pypdf pypdfium2 Pillow pydantic platformdirs psutil
python PDF_Laboratory.py
```

Modos de linha de comando (úteis para CI e diagnóstico, sem abrir a interface):

```bash
python PDF_Laboratory.py --diagnostico   # relatório de ambiente e dependências opcionais
python PDF_Laboratory.py --self-test     # suíte de testes internos, sem interface gráfica
```

## Por que um único arquivo?

Decisão deliberada de arquitetura: facilita distribuição (basta um arquivo),
auditoria (todo o código visível em um lugar) e empacotamento com PyInstaller.
Mudanças que dividissem o arquivo em módulos exigiriam alinhamento explícito
com os mantenedores antes de serem aceitas.

## Dependências obrigatórias

PySide6, pypdf, pypdfium2, Pillow, pydantic, platformdirs, psutil — todas
instaladas via `pip`. Ver licenças em `THIRD_PARTY_NOTICES.md`.

## Ferramentas externas opcionais

Algumas funcionalidades dependem de programas instalados separadamente pelo
usuário no sistema operacional. O aplicativo **detecta automaticamente** esses
programas (procurando pelo executável no `PATH` e em caminhos comuns de
instalação no Windows) mas **nunca os instala automaticamente** sem
consentimento explícito.

| Ferramenta | Usada para | Detecção |
|---|---|---|
| Ghostscript | Otimização/compressão avançada | `gs` / `gswin64c` / `gswin32c` + caminhos comuns do Windows |
| LibreOffice | Conversão Word/Excel/PowerPoint ↔ PDF | `soffice` + caminhos comuns do Windows |
| Tesseract | OCR (reconhecimento de texto) | `tesseract` + `Program Files` |
| qpdf | Reparo avançado de arquivos corrompidos | `qpdf` no `PATH` |
| pyHanko | Assinatura digital criptográfica (ICP-Brasil) | biblioteca Python opcional |

Quando uma dependência não é encontrada, a interface mostra um alerta
explicando o que falta e como instalar — nunca um botão ativo que finge
funcionar.

## Empacotamento (executável standalone)

Ver `.github/workflows/release-desktop.yml` — gera um executável via
PyInstaller (`--onefile`) para Windows e Linux a cada tag `desktop-v*`, com
checksum SHA-256 anexado ao release.

## Testes e validação

- `python -m py_compile PDF_Laboratory.py` — verificação de sintaxe.
- `python PDF_Laboratory.py --diagnostico` — relatório de ambiente.
- `python PDF_Laboratory.py --self-test` — suíte de testes internos (modelos,
  serviços, parsers), sem abrir a interface gráfica.
- Validação visual manual: captura de tela de cada tela principal, nos temas
  claro e escuro, em pelo menos uma resolução menor (1366×768) — ver o
  changelog da versão 1.7.0 para o registro da última rodada realizada.
