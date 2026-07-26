# PDF Laboratory — Web

Aplicativo web para manipulação de PDFs, executado inteiramente no
navegador — sem backend, sem upload de documentos. Ver a documentação
completa em [`../docs/WEB.md`](../docs/WEB.md), [`../docs/PRIVACY.md`](../docs/PRIVACY.md)
e [`../docs/COMPATIBILITY.md`](../docs/COMPATIBILITY.md).

## Desenvolvimento

```bash
npm ci
npm run dev
```

## Scripts

- `npm run dev` — servidor de desenvolvimento
- `npm run build` — checagem de tipos + build de produção
- `npm run preview` — serve o build localmente
- `npm run lint` / `npm run typecheck`
- `npm run test` — Vitest (unidade/componente)
- `npm run test:e2e` — Playwright + axe-core (requer `npx playwright install`)
- `npm run fixtures:generate` — gera PDFs sintéticos de teste
