# Contribuindo com o PDF Laboratory

Obrigado por considerar contribuir. Este repositório contém dois projetos
independentes que compartilham identidade visual e propósito, mas **não**
compartilham código de execução:

- `desktop/` — aplicativo Python + PySide6, um único arquivo executável.
- `web/` — aplicativo React + TypeScript + Vite, publicado no GitHub Pages.

## Regras gerais

1. **Nunca** inclua em commits, issues ou PRs: senhas, tokens, chaves de API,
   certificados (`.pfx`/`.p12`), documentos PDF reais/pessoais/médicos/jurídicos,
   arquivos `.env`, ou caminhos de pastas pessoais do seu computador.
2. Todo PDF usado em testes deve ser **sintético**, gerado por
   `shared/test-fixtures/generate.mjs` ou equivalente.
3. Textos voltados ao usuário são em português do Brasil, com acentuação correta.
4. Nunca ative um botão ou funcionalidade que não tenha implementação real por
   trás — se uma ferramenta não está pronta, ela deve aparecer desabilitada com
   uma explicação clara (ver `docs/LIMITATIONS.md`).

## Contribuindo com o desktop (`desktop/PDF_Laboratory.py`)

- O arquivo deve continuar sendo executável isoladamente: `python PDF_Laboratory.py`.
- Não divida o arquivo em múltiplos módulos sem alinhar antes com os mantenedores —
  isso é uma decisão de arquitetura deliberada (facilita distribuição e auditoria).
- Antes de abrir um PR, rode:
  ```bash
  python -m py_compile desktop/PDF_Laboratory.py
  python desktop/PDF_Laboratory.py --diagnostico
  python desktop/PDF_Laboratory.py --self-test
  ```

## Contribuindo com a versão web (`web/`)

```bash
cd web
npm ci
npm run lint
npm run typecheck
npm run test
npm run build
```

Novas ferramentas devem ser classificadas em `src/data/tools.ts` como
`browser` (totalmente viável no navegador), `limited` (viável com limitações
reais e documentadas) ou `desktop-only` (indisponível sem componente nativo).
Nunca mova uma ferramenta para `browser` sem uma implementação funcional.

## Licenciamento de novas dependências

Antes de adicionar qualquer nova dependência (npm ou pip), verifique a
licença e adicione uma entrada em `THIRD_PARTY_NOTICES.md`. Dependências com
licenças fortemente copyleft (GPL/AGPL) não devem ser adicionadas como
biblioteca importada — apenas invocadas como processo externo (subprocess),
como já é feito com Ghostscript/LibreOffice no desktop.

## Processo de PR

Use o modelo em `.github/pull_request_template.md` e marque todos os itens do
checklist antes de solicitar revisão.
