# Checklist de publicação — PDF Laboratory

## Estado atual (verificado nesta auditoria pré-merge)

- **Repositório:** publicado em https://github.com/adlerazevedo/pdf-laboratory.
- **Branch:** `feat/complete-pdf-laboratory-web`, publicada (`git push` já
  feito pelo usuário, fora desta ferramenta).
- **Pull Request:** [#16](https://github.com/adlerazevedo/pdf-laboratory/pull/16),
  aberto, de `feat/complete-pdf-laboratory-web` para `main`, ainda **não
  mesclado**.
- **Commit HEAD da branch:** `07d25e5` (merge de `af1ead0`, o commit final
  produzido nas Fases 1–10 desta sessão, com `17f3f92` de `main` — um
  commit de `main` que só mudou a permissão do arquivo
  `desktop/PDF_Laboratory.py` de executável para não-executável, sem
  alterar uma linha de conteúdo; checksum SHA-256 idêntico ao já
  documentado).
- **GitHub Pages:** já está no ar em https://adlerazevedo.github.io/pdf-laboratory/,
  mas confirmado por navegação real nesta auditoria que ainda serve a
  versão **anterior à Fase 5** (sem organizar páginas com o conjunto
  completo de ferramentas atual, sem a página "Web × Desktop") — o
  `deploy-pages.yml` só publica a partir de `main`, então a versão deste
  PR só ficará no ar depois de mesclado.
- **CI real do PR #16:** CodeQL passou (2 jobs); `web-tests` falhou no job
  `e2e` (causa raiz identificada e corrigida nesta auditoria — ver
  `docs/CI.md` e o relatório da Fase 10).
- **Dependabot:** 15 PRs abertos, todos major, nenhum mesclado, nenhum
  necessário para a correção acima (ver `docs/CI.md`).

## Auditoria de segredos/governança (repetida sobre o commit 07d25e5 real)

- [x] **Segredos**: varredura em todo o histórico do git do repositório
  público (`git log --all -p`). Nenhuma credencial, chave privada, token
  ou senha real encontrada — os únicos "password"-like strings são senhas
  de teste óbvias usadas pelo `--self-test` do desktop (`teste-123`,
  `autoteste123`, `senha_errada`). Nenhum arquivo
  `.env`/`.pem`/`.key`/`.pfx`/`.p12` rastreado. Nenhum caminho pessoal
  (`/home/`, `C:\Users\`, `/Users/`) em nenhum commit.
- [x] **`.gitignore`** e tamanho de arquivos: nada anômalo rastreado
  (maior arquivo é `desktop/PDF_Laboratory.py`, 478 KB, single-file por
  design; nenhum sourcemap versionado — só gerados no build).
- [x] **Arquivos de governança**: LICENSE (MIT), THIRD_PARTY_NOTICES.md,
  CODE_OF_CONDUCT.md, CONTRIBUTING.md, SECURITY.md, issue templates e PR
  template — presentes e consistentes com o código de `07d25e5`.
- [x] **Privacidade/segurança do código real**: confirmado por grep direto
  no código-fonte de `07d25e5` (não só na documentação) — `localStorage`
  usado somente para preferência de tema; zero ocorrências de
  `indexedDB` no service worker/workbox gerado (a única fonte real de
  IndexedDB em tempo de execução é interna ao Tesseract.js);
  `globPatterns` do Workbox nunca casa `.pdf`; nenhum campo de
  certificado PFX/P12 em nenhum tipo de opção da versão web; único
  `console.*` do código-fonte é um aviso informativo de PWA pronto para
  uso offline, sem dado sensível.
- [x] **Dependências vulneráveis**: `npm audit` reporta 10 vulnerabilidades
  altas, todas em ferramentas de build/teste (`workbox-build` via cadeia
  `ejs`→`jake`→`filelist`→`minimatch`→`brace-expansion`, e
  `@vitest/coverage-v8`) — nenhuma em dependência de runtime enviada ao
  navegador do usuário (`react`, `pdf-lib`, `pdfjs-dist`, `jszip`,
  `tesseract.js`).

## O que ainda depende de ação do usuário

- **Merge do PR #16**: decisão do usuário, não desta auditoria (ver
  recomendação no relatório final da Fase 10).
- **Corrigir a falha do job `e2e`** antes ou depois do merge: correção já
  aplicada em branch local `fase10-auditoria-pre-merge` (ver bundle
  gerado nesta sessão) — precisa ser aplicada e enviada ao PR por quem
  tem push real ao repositório.
- **Após o merge**: confirmar que `deploy-pages.yml` publica com sucesso e
  só então tratar a URL pública como refletindo a versão atual.
