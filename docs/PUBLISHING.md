# Checklist de publicação — PDF Laboratory

Estado no commit `d74f762` (branch `feature/web-organize-images-tools`),
verificado nesta sessão.

## O que já foi verificado e está OK para publicar

- [x] **Segredos**: varredura em todo o histórico do git (`git log --all -p`),
  não só no diff recente. Nenhuma credencial, chave privada, token ou senha
  real encontrada — os únicos "password"-like strings são senhas de teste
  óbvias usadas pelo `--self-test` do desktop (`teste-123`, `autoteste123`,
  `senha_errada`). Nenhum arquivo `.env`/`.pem`/`.key`/`.pfx`/`.p12` rastreado.
- [x] **`.gitignore`**: cobre segredos, `node_modules`, `dist`,
  `test-results`, `__pycache__`, fixtures geradas e documentos pessoais.
  Confirmado que nenhum desses padrões está de fato rastreado.
- [x] **Tamanho dos arquivos**: nada anômalo — o maior é o próprio
  `desktop/PDF_Laboratory.py` (478 KB, single-file por design) e
  `web/package-lock.json` (314 KB, esperado e deve continuar versionado
  para instalações reprodutíveis via `npm ci`).
- [x] **Arquivos de governança**: LICENSE (MIT), THIRD_PARTY_NOTICES.md
  (lista real e atual de dependências — inclui Tesseract.js, JSZip,
  vite-plugin-pwa, adicionadas nas fases mais recentes), CODE_OF_CONDUCT.md,
  CONTRIBUTING.md, SECURITY.md, issue templates e PR template — todos
  presentes e consistentes com o estado atual do código.
- [x] **Duas imprecisões reais corrigidas nesta auditoria**: SECURITY.md e
  docs/PRIVACY.md afirmavam vagamente que IndexedDB era usado para "estado
  técnico temporário" — verificado via grep no código-fonte e no service
  worker gerado que a própria aplicação nunca usa IndexedDB; a única fonte
  real é o cache interno de modelos de idioma do Tesseract.js. Corrigido
  para descrever isso com precisão, não uma alegação vaga.
- [x] **Árvore de trabalho limpa**: `git status` sem alterações pendentes;
  todas as fases (1 a 10) commitadas na branch `feature/web-organize-images-tools`.
- [x] **Validação técnica** (repetida nesta sessão, já que o bump de versão
  e os ajustes de documentação tocaram `package.json`): `tsc -b --noEmit`,
  `oxlint`, `vitest run` (67/67) e `vite build`, todos limpos.
- [x] **Suíte Playwright completa** (Fase 7): 16 arquivos de spec, 68 testes,
  executados de verdade contra um build de produção.
- [x] **CI como código**: 5 workflows do GitHub Actions revisados e com
  sintaxe YAML validada; `dependabot.yml` com agrupamento de atualizações
  menores; gotcha conhecido do CodeQL (conflito "default setup" vs
  "advanced setup") documentado com o passo manual exato necessário no
  primeiro push (`docs/CI.md`).
- [x] **Checksum do desktop**: `sha256: 32fb44e966f56975c0e970fb52cbb9123290fcbf57464b80c59cd7bdfd6f7a53`
  (`desktop/PDF_Laboratory.py`), igual ao já publicado em `desktop/CHECKSUMS.txt`
  e no README.

## O que NÃO pôde ser feito nesta sessão — e por quê

Criar o repositório no GitHub e abrir o PR exige acesso real ao GitHub
(API autenticada ou `git push` com credenciais). O conector GitHub deste
ambiente está listado como exigindo autenticação OAuth, e esta sessão é
não-interativa — não há como completar esse fluxo de login aqui. Por isso:

- Nenhum repositório foi criado no GitHub.
- Nenhum `git push` foi executado (não há `git remote` configurado).
- Nenhum Pull Request foi aberto.
- Os workflows de CI, o Dependabot e o CodeQL nunca rodaram de fato no
  GitHub — só localmente, como descrito acima e em `docs/CI.md`.

## Como publicar de fato (passo a passo, para você executar)

1. Criar um repositório vazio no GitHub (via github.com ou `gh repo create`).
2. A partir da raiz deste checkout local:
   ```bash
   git remote add origin git@github.com:<seu-usuario>/pdf-laboratory.git
   git push -u origin feature/web-organize-images-tools
   git push origin main
   ```
3. Antes do primeiro push que dispare o `codeql.yml`: em
   *Settings → Code security and analysis → Code scanning*, deixar como
   **Advanced** (nunca "Default") — ver `docs/CI.md` para o porquê.
4. Em *Settings → Pages*, configurar a fonte como "GitHub Actions" (o
   workflow `deploy-pages.yml` já está pronto para publicar `web/dist`).
5. Abrir o Pull Request de `feature/web-organize-images-tools` para `main`
   (pela interface do GitHub, ou `gh pr create`).
6. Depois que o Pages publicar, confirmar a URL real por acesso direto e
   só então atualizar o trecho "URL pública: ainda não publicada" no
   README.md e no `manifest`/`start_url` se necessário.

Alternativa: se você conectar o conector do GitHub nesta ferramenta (via
as configurações de conectores do Claude), posso executar os passos 1, 2
e 5 diretamente na próxima sessão.
