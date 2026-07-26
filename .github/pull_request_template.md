## Descrição

<!-- O que este PR muda, e por quê. -->

## Área afetada

- [ ] Desktop (`desktop/PDF_Laboratory.py`)
- [ ] Web (`web/`)
- [ ] Documentação
- [ ] CI/CD

## Checklist

- [ ] `desktop/PDF_Laboratory.py` continua sendo um único arquivo executável (`python PDF_Laboratory.py`), sem imports internos quebrados
- [ ] `python -m py_compile desktop/PDF_Laboratory.py` passa
- [ ] `python desktop/PDF_Laboratory.py --diagnostico` e `--self-test` passam (se a mudança afeta o desktop)
- [ ] `npm run lint && npm run typecheck && npm run test` passam em `web/` (se a mudança afeta o web)
- [ ] Nenhum segredo, token, certificado, PDF real/pessoal ou caminho de usuário foi incluído
- [ ] Textos em português revisados (acentuação correta)
- [ ] Documentação (`README.md`/`docs/*.md`) atualizada, se necessário
