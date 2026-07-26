# CI/CD, Dependabot e CodeQL

## Estado real neste momento

Este repositório **ainda não foi publicado no GitHub** (sem `git remote`,
sem URL pública confirmada — ver `README.md`). Por isso, nada abaixo já
rodou de verdade em CI: os workflows foram escritos e revisados
localmente, mas nenhum deles foi executado pelo GitHub Actions, não há
Pull Requests do Dependabot para triar, e o CodeQL nunca analisou este
código no GitHub. Este documento descreve o que existe hoje como
configuração e o que precisa acontecer, uma única vez, no momento em que
o repositório for de fato criado e publicado — para que a primeira
execução real já saia correta, sem surpresas.

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

## CodeQL — passo manual obrigatório na primeira publicação

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
documentado aqui e como comentário no topo de `codeql.yml`.

## Dependabot (`.github/dependabot.yml`)

Três ecossistemas monitorados semanalmente: `npm` (`/web`), `pip`
(`/desktop`) e `github-actions` (raiz). Cada um agrupa atualizações de
versão *minor*/*patch* em um único PR (`groups: ... update-types: [minor,
patch]`) para reduzir ruído — atualizações *major* continuam chegando
como PRs individuais, já que essas exigem revisão manual mais cuidadosa
(podem quebrar a API). Limite de 10 PRs abertos simultâneos por
ecossistema (exceto `github-actions`, que não costuma acumular volume).

### Política de triagem (a ser aplicada quando os primeiros PRs existirem)

1. PRs de `patch`/`minor` agrupados: revisar o changelog agregado, rodar a
   suíte de testes do workflow correspondente (já roda automaticamente no
   PR) e mesclar se tudo passar.
2. PRs de versão `major`: nunca mesclar automaticamente. Ler o changelog
   de breaking changes da dependência, testar localmente, e só então
   decidir.
3. PRs de `github-actions`: mesclar após confirmar que o workflow ainda
   roda com a nova versão da action (o próprio PR já dispara os workflows
   afetados).

Como nenhum PR existe ainda neste repositório não publicado, esta seção
descreve a política a ser seguida — não um relato de PRs já triados.
