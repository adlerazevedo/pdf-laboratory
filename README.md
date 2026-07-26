# PDF Laboratory

Suíte local e privada para manipulação de PDFs, com aplicativo desktop em
Python e versão web executada inteiramente no navegador.

Este repositório contém **duas aplicações independentes**:

| | Desktop | Web |
|---|---|---|
| Tecnologia | Python + PySide6 | React + TypeScript + Vite |
| Onde roda | No seu computador (Windows/Linux/macOS) | No seu navegador |
| Precisa instalar? | Sim (Python + dependências, ou executável empacotado) | Não — acesse a URL. Pode ser instalado como PWA |
| Envia documentos para algum servidor? | Não | Não — não há backend nesta versão |
| Ferramentas mais avançadas (Ghostscript, LibreOffice, assinatura digital ICP-Brasil, redação segura) | Sim | Não — permanecem exclusivas do desktop, ver `docs/LIMITATIONS.md` |

## Versão desktop

```bash
cd desktop
pip install PySide6 pypdf pypdfium2 Pillow pydantic platformdirs psutil
python PDF_Laboratory.py
```

Detalhes completos, incluindo dependências opcionais e empacotamento em
executável, em [`docs/DESKTOP.md`](docs/DESKTOP.md).

Checksum da versão atual (`desktop/PDF_Laboratory.py`, v1.7.0):
```
sha256: 32fb44e966f56975c0e970fb52cbb9123290fcbf57464b80c59cd7bdfd6f7a53
```

## Versão web

```bash
cd web
npm ci
npm run dev
```

Versão atual: `0.1.0` (ver `web/package.json`) — ainda não publicada
publicamente, ver nota abaixo.

**URL pública:** ainda não publicada — este repositório está sendo preparado
localmente e ainda não foi criado no GitHub nesta sessão de trabalho. Assim
que publicado via GitHub Pages, a URL será
`https://<usuario-ou-organização>.github.io/pdf-laboratory/` e este trecho
será atualizado com o endereço real, confirmado por acesso direto — nunca
antes disso.

Detalhes completos, incluindo arquitetura do motor de PDF e o estado real
da suíte de testes (68 testes end-to-end, todos executados de verdade
neste ambiente), em [`docs/WEB.md`](docs/WEB.md).

## O que cada ferramenta faz, e onde está disponível

Ver a tabela completa, ferramenta por ferramenta, em
[`docs/COMPATIBILITY.md`](docs/COMPATIBILITY.md). Resumo por nível:

- **Completo nas duas versões** (9 ferramentas): unir, dividir (6 modos),
  organizar páginas (reordenar/girar/duplicar/excluir/inserir em branco),
  extrair páginas, imagens → PDF, PDF → imagens, marca d'água, numeração de
  páginas, edição de metadados.
- **Completo no desktop, parcial na web** (3 ferramentas, com limitações
  reais descritas na tabela): OCR (Tesseract.js em vez de OCRmyPDF),
  assinatura visual/carimbo (sem validade jurídica — nunca solicita
  certificado PFX/P12), compressão básica (recomprime só imagens JPEG já
  embutidas).
- **Exclusivo do desktop** (8 ferramentas): otimização avançada
  (Ghostscript), conversão Word/Excel/PowerPoint (LibreOffice), assinatura
  digital ICP-Brasil (certificado PFX/P12), redação segura e reparo
  avançado (qpdf), marcadores/bookmarks, comparação de documentos, inspeção
  técnica do PDF. Nenhuma delas aparece como botão ativo falso na web — a
  própria versão web tem uma página "Web × Desktop", acessível pela barra
  lateral, explicando a diferença entre "limitação permanente" (depende de
  binário nativo ou material sensível) e "ainda não portada" (sem motor
  equivalente construído, mas sem impedimento técnico definitivo), e como
  obter o desktop.

## Privacidade

Nenhuma das duas versões envia seus documentos para um servidor. Detalhes em
[`docs/PRIVACY.md`](docs/PRIVACY.md).

## Segurança

Política de reporte de vulnerabilidades em [`SECURITY.md`](SECURITY.md);
detalhes técnicos em [`docs/SECURITY.md`](docs/SECURITY.md).

## Arquitetura

[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Limitações conhecidas

[`docs/LIMITATIONS.md`](docs/LIMITATIONS.md) — lido antes de assumir que uma
funcionalidade existe.

## Contribuindo

[`CONTRIBUTING.md`](CONTRIBUTING.md).

## Licença

MIT — ver [`LICENSE`](LICENSE). Licenças de todas as dependências de
terceiros em [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).

## Changelog

[`CHANGELOG.md`](CHANGELOG.md).
