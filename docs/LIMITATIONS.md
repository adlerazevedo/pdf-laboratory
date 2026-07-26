# Limitações conhecidas

Este documento existe para que ninguém seja surpreendido pelo que o projeto
**não** faz. Ver também `docs/COMPATIBILITY.md` para a tabela completa por
ferramenta.

## Web — o que ainda não existe

- **Organizar páginas** (reordenar/girar/duplicar/excluir/inserir em branco),
  **imagens → PDF** e **PDF → imagens** têm o motor implementado e testado,
  mas ainda não têm uma tela dedicada na interface.
- **OCR**, **assinatura visual (carimbo)** e **compressão básica** ainda não
  foram implementados nesta versão web (planejados como ferramentas de nível
  "limitado" — ver `web/src/data/tools.ts`).
- Não há suporte a arquivos protegidos por senha (a versão web detecta e
  informa esse caso, mas não solicita/valida a senha ainda).
- Testes end-to-end (Playwright) estão escritos e configurados, mas não foram
  executados no ambiente usado para construir este projeto por uma limitação
  do próprio ambiente (faltam bibliotecas de sistema do Chromium, sem acesso
  root para instalá-las) — eles rodam no GitHub Actions. Não trate como
  "testado" até o workflow `web-tests.yml` ter rodado com sucesso.

## Web — o que nunca vai existir (por design, não por falta de tempo)

Estas funcionalidades dependem de binários nativos ou de material sensível
que nunca deve entrar em um navegador. Permanecerão exclusivas do desktop:

- Otimização avançada via Ghostscript.
- Conversão fiel Word/Excel/PowerPoint ↔ PDF via LibreOffice.
- Assinatura digital criptográfica com certificado PFX/P12 (ICP-Brasil).
- Reparo avançado de arquivos corrompidos via qpdf.
- Redação (censura) definitiva e irreversível de conteúdo sensível.

Se uma dessas funcionalidades se tornar essencial para a versão web no
futuro, a solução correta **não** é reimplementá-la de forma incompleta no
navegador — é propor um serviço de backend dedicado, com uma análise
explícita de tecnologia, hospedagem, custo, retenção de dados, criptografia,
privacidade e risco, sujeita a aprovação explícita antes de qualquer
implementação.

## Desktop — limitações conhecidas

- Alguns painéis ainda exigem rolagem interna para alcançar o botão de ação
  principal em telas menores (ex.: Otimizar PDF).
- Não há um modo de barra lateral compacta.
- Não há atalho de teclado dedicado para alternar entre tema claro e escuro.

## Compromisso de honestidade

Nunca declaramos uma funcionalidade como "implementada" sem código real por
trás, nem "testada" sem execução real, nem "publicada" sem uma URL
publicamente acessível confirmada.
