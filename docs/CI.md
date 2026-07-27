# CI/CD, Dependabot e CodeQL

## Estado real neste momento

O repositório está publicado em
https://github.com/adlerazevedo/pdf-laboratory. O trabalho descrito nesta
página está no Pull Request
[#16](https://github.com/adlerazevedo/pdf-laboratory/pull/16)
(`feat/complete-pdf-laboratory-web` → `main`), consultado publicamente
nesta auditoria: **CodeQL passou** (2 jobs, `python` e
`javascript-typescript`, ~1m); **web-tests falhou** — o job
`unit-and-lint` passou, mas o job `e2e` falhou porque o passo "Gerar
fixtures sintéticas de teste" não está presente nesse job (só existe em
`unit-and-lint`, e cada job do GitHub Actions roda em runner/checkout
próprio — ver detalhe e correção abaixo). Há 15 Pull Requests abertos do
Dependabot, todos de versão *major* (nenhum patch/minor pendente ainda),
listados na seção correspondente mais abaixo. O CodeQL não apresentou o
conflito "default setup vs. advanced setup" descrito nesta página — ou
seja, o passo manual de Settings já foi feito corretamente.

## Workflows (`.github/workflows/`)

| Arquivo | Dispara em | O que faz |
|---|---|---|
| `web-tests.yml` | push/PR que toquem `web/` ou `shared/` | Lint, checagem de tipos, Vitest, `npm audit` (não bloqueia), build de produção e suíte Playwright + axe-core completa (instala Chromium via `playwright install --with-deps`) |
| `deploy-pages.yml` | push em `main` que toque `web/`/`shared/`, ou manual | Lint + Vitest (bloqueiam o deploy se falharem) + build de produção + publicação no GitHub Pages |
| `desktop-tests.yml` | push/PR que toquem `desktop/` | Instala dependências de sistema para Qt offscreen, verifica sintaxe (`py_compile`), roda `--diagnostico` e `--self-test`, varre por segredos/chaves óbvias no código |
| `release-desktop.yml` | tag `desktop-v*`, ou manual | Empacota o app desktop com PyInstaller (Windows + Linux), calcula SHA-256 do executável, publica release do GitHub com os artefatos |
| `codeql.yml` | push/PR em `main`, semanal (segunda 06:00 UTC) | Análise estática de segurança (CodeQL) para Python e JavaScript/TypeScript |

Todos os workflows usam `permissions` explícito e mínimo por job (nunca o
padrão implícito de escrita ampla).

## CodeQL — passo manual obrigatório na primeira publicação (já feito corretamente)

GitHub tem dois modos de code scanning que **não podem coexistir**: o
"default setup" (ligado só pela interface, em *Settings → Code security
and analysis → Code scanning*) e o "advanced setup" (um workflow próprio,
como `codeql.yml` deste repositório). Se o default setup estiver ativo
quando este workflow rodar, a análise falha com o erro *"CodeQL analyses
from advanced configurations cannot be processed when the default setup
is enabled"* — uma falha de configuração, não do código.

**Antes do primeiro push para `main` no repositório publicado**, confirme
em *Settings → Code security and analysis* que "Code scanning" está como
**Advanced** (ou desativado) — nunca "Default". Esse passo só existe na UI
do GitHub, não pode ser expresso em arquivo de workflow, e por isso está
documentado aqui e como comentário no topo de `codeql.yml`. Confirmado
nesta auditoria: o run do PR #16 (`codeql #17`) terminou com sucesso nos
2 jobs da matriz, sem o erro de conflito descrito acima — o passo manual
já foi feito corretamente antes do primeiro push.

## Dependabot (`.github/dependabot.yml`)

Três ecossistemas monitorados semanalmente: `npm` (`/web`), `pip`
(`/desktop`) e `github-actions` (raiz). Cada um agrupa atualizações de
versão *minor*/*patch* em um único PR (`groups: ... update-types: [minor,
patch]`) para reduzir ruído — atualizações *major* continuam chegando
como PRs individuais, já que essas exigem revisão manual mais cuidadosa
(podem quebrar a API). Limite de 10 PRs abertos simultâneos por
ecossistema (exceto `github-actions`, que não costuma acumular volume).

### Política de triagem

1. PRs de `patch`/`minor` agrupados: revisar o changelog agregado, rodar a
   suíte de testes do workflow correspondente (já roda automaticamente no
   PR) e mesclar se tudo passar.
2. PRs de versão `major`: nunca mesclar automaticamente. Ler o changelog
   de breaking changes da dependência, testar localmente, e só então
   decidir.
3. PRs de `github-actions`: mesclar após confirmar que o workflow ainda
   roda com a nova versão da action (o próprio PR já dispara os workflows
   afetados).

### Estado real: 15 Pull Requests abertos (consultado nesta auditoria)

Todos os 15 PRs abertos são de versão **major** — não há nenhum PR
patch/minor pendente ainda (o repositório acabou de ser publicado, então
o Dependabot encontrou de uma vez as versões major mais recentes de cada
dependência). Nenhum foi mesclado; nenhum foi mesclado no PR #16.

| PR | Dependência | De → Para | Ecossistema |
|---|---|---|---|
| #15 | @vitejs/plugin-react | 4.7.0 → 6.0.4 | npm (major) |
| #14 | @types/node | 22.20.1 → 26.1.1 | npm (major) |
| #13 | vitest | 3.2.7 → 4.1.10 | npm (major) |
| #12 | @testing-library/jest-dom | 6.9.1 → 7.0.0 | npm (major) |
| #11 | pdfjs-dist | 4.10.38 → 6.1.200 | npm (major) |
| #10 | vite-plugin-pwa | 0.21.2 → 1.3.0 | npm (major) |
| #9 | oxlint | 0.11.1 → 1.75.0 | npm (major) |
| #8 | vite | 6.4.3 → 8.1.5 | npm (major) |
| #7 | @vitest/coverage-v8 | 3.2.7 → 4.1.10 | npm (major) |
| #6 | typescript | 5.7.3 → 7.0.2 | npm (major) |
| #5 | actions/configure-pages | 5 → 6 | github-actions (major) |
| #4 | actions/download-artifact | 4 → 8 | github-actions (major) |
| #3 | actions/setup-python | 5 → 7 | github-actions (major) |
| #2 | actions/upload-pages-artifact | 3 → 5 | github-actions (major) |
| #1 | softprops/action-gh-release | 2 → 3 | github-actions (major) |

Nenhuma delas é necessária para corrigir a falha comprovada do job `e2e`
(causa raiz é de configuração do workflow, não de versão de dependência —
ver correção na seção de workflows). Por isso, nenhuma foi trazida para o
PR #16, conforme a política acima.
