import { expect, test } from "@playwright/test";
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

/**
 * Fase pré-ICP-Brasil, Etapa 2 — correção do problema conhecido do worker do
 * PDF.js no PWA: antes desta correção, `globPatterns` em vite.config.ts não
 * incluía `.mjs`, então o worker de ~1.3 MB do pdf.js (pdf.worker.min-*.mjs)
 * NUNCA entrava no precache do Workbox — ficando de fora do cache do
 * service worker mesmo estando referenciado pelo bundle principal. Estes
 * testes leem o `dist/` já construído (sem servidor) para confirmar a
 * correção de forma estrutural, além dos testes de comportamento em
 * pwa.spec.ts (que exercitam o app já servido).
 */

const distDir = join(import.meta.dirname, "../dist");
const assetsDir = join(distDir, "assets");

function listAssetFiles(): string[] {
  return readdirSync(assetsDir);
}

test.describe("Integridade do worker do PDF.js no build de produção (Etapa 2)", () => {
  test("o worker do pdf.js existe no dist e termina em .mjs", () => {
    const files = listAssetFiles();
    const pdfJsWorkers = files.filter((f) => /^pdf\.worker\.min-.*\.mjs$/.test(f));
    expect(pdfJsWorkers.length).toBeGreaterThanOrEqual(1);
  });

  test("não há mais de um worker do pdf.js no dist (sem resíduo de build anterior)", () => {
    const files = listAssetFiles();
    const pdfJsWorkers = files.filter((f) => /^pdf\.worker\.min-.*\.mjs$/.test(f));
    expect(pdfJsWorkers).toHaveLength(1);
  });

  test("o worker está referenciado em algum bundle JS do próprio build", () => {
    const files = listAssetFiles();
    const pdfJsWorkers = files.filter((f) => /^pdf\.worker\.min-.*\.mjs$/.test(f));
    const workerFileName = pdfJsWorkers[0];
    const jsFiles = files.filter((f) => f.endsWith(".js"));
    let referencedSomewhere = false;
    for (const jsFile of jsFiles) {
      const content = readFileSync(join(assetsDir, jsFile), "utf-8");
      if (content.includes(workerFileName)) {
        referencedSomewhere = true;
        break;
      }
    }
    expect(referencedSomewhere).toBe(true);
  });

  test("o worker está incluído no precache do service worker (sw.js) — correção real do globPatterns", () => {
    const swPath = join(distDir, "sw.js");
    expect(existsSync(swPath)).toBe(true);
    const swContent = readFileSync(swPath, "utf-8");
    const files = listAssetFiles();
    const workerFileName = files.find((f) => /^pdf\.worker\.min-.*\.mjs$/.test(f));
    expect(workerFileName).toBeTruthy();
    expect(swContent).toContain(workerFileName!);
  });

  test("nenhuma referência a um hash de worker de um build anterior (o único .mjs no dist é o único referenciado no sw.js)", () => {
    const swPath = join(distDir, "sw.js");
    const swContent = readFileSync(swPath, "utf-8");
    const mjsReferencesInSw = [...swContent.matchAll(/pdf\.worker\.min-[A-Za-z0-9_-]+\.mjs/g)].map((m) => m[0]);
    const uniqueReferences = Array.from(new Set(mjsReferencesInSw));
    const files = listAssetFiles();
    const actualWorkerFiles = files.filter((f) => /^pdf\.worker\.min-.*\.mjs$/.test(f));
    // toda referência encontrada no sw.js deve corresponder a um arquivo que realmente existe no dist
    for (const ref of uniqueReferences) {
      expect(actualWorkerFiles).toContain(ref);
    }
    // e deve haver exatamente uma referência única (não duas gerações de hash coexistindo)
    expect(uniqueReferences.length).toBeLessThanOrEqual(1);
  });

  test("todos os assets referenciados pelo index.html existem de fato no dist", () => {
    const indexHtml = readFileSync(join(distDir, "index.html"), "utf-8");
    const srcMatches = [...indexHtml.matchAll(/(?:src|href)="([^"]+\.(?:js|css|svg|webmanifest))"/g)].map((m) => m[1]);
    for (const ref of srcMatches) {
      const relative = ref.replace(/^\/pdf-laboratory\//, "").replace(/^\//, "");
      const fullPath = join(distDir, relative);
      expect(existsSync(fullPath), `asset referenciado no index.html deveria existir: ${ref}`).toBe(true);
    }
  });
});

test.describe("Abertura de PDF sintético no build de produção servido", () => {
  test("a aplicação consegue abrir um PDF sintético real através da UI, no build de produção", async ({ page }) => {
    const fixture = join(import.meta.dirname, "../../shared/test-fixtures/generated/sintetico-3-paginas.pdf");
    await page.goto("/");
    await page.getByRole("button", { name: "Extrair páginas", exact: true }).first().click();
    await page.setInputFiles('input[type="file"]', fixture);
    await expect(page.getByText(/3 página/)).toBeVisible({ timeout: 15_000 });
  });
});
