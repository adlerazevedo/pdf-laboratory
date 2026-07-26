import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const FIXTURE_3 = join(import.meta.dirname, "../../shared/test-fixtures/generated/sintetico-3-paginas.pdf");

async function readDownloadBytes(download: import("@playwright/test").Download): Promise<Buffer> {
  const path = await download.path();
  if (!path) throw new Error("download path unavailable");
  return readFileSync(path);
}

async function extractPageTexts(bytes: Buffer): Promise<string[]> {
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(bytes), useWorkerFetch: false, isEvalSupported: false });
  const doc = await loadingTask.promise;
  const texts: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    texts.push(content.items.map((it: { str?: string }) => it.str ?? "").join(" "));
  }
  return texts;
}

test("numeração de páginas: com início padrão (1), cada página recebe 'N / total' real e legível", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Numeração de páginas", exact: true }).first().click();
  await page.setInputFiles('input[type="file"]', FIXTURE_3);
  await expect(page.getByText("sintetico-3-paginas.pdf")).toBeVisible({ timeout: 15_000 });

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Aplicar", exact: true }).click().then(async () => {
      await expect(page.getByText("Concluído")).toBeVisible({ timeout: 15_000 });
      await page.getByRole("button", { name: "Baixar", exact: true }).click();
    }),
  ]);
  expect(download.suggestedFilename()).toMatch(/-numerado\.pdf$/);

  const bytes = await readDownloadBytes(download);
  const { PDFDocument } = await import("pdf-lib");
  const doc = await PDFDocument.load(bytes);
  expect(doc.getPageCount()).toBe(3);

  const texts = await extractPageTexts(bytes);
  expect(texts[0]).toMatch(/1\s*\/\s*3/);
  expect(texts[1]).toMatch(/2\s*\/\s*3/);
  expect(texts[2]).toMatch(/3\s*\/\s*3/);
});

test("numeração de páginas: iniciar em 5 desloca o número exibido em cada página", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Numeração de páginas", exact: true }).first().click();
  await page.setInputFiles('input[type="file"]', FIXTURE_3);
  await expect(page.getByText("sintetico-3-paginas.pdf")).toBeVisible({ timeout: 15_000 });

  await page.getByLabel("Começar a numerar em").fill("5");

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Aplicar", exact: true }).click().then(async () => {
      await expect(page.getByText("Concluído")).toBeVisible({ timeout: 15_000 });
      await page.getByRole("button", { name: "Baixar", exact: true }).click();
    }),
  ]);
  const bytes = await readDownloadBytes(download);
  const texts = await extractPageTexts(bytes);
  expect(texts[0]).toMatch(/5\s*\/\s*3/);
  expect(texts[1]).toMatch(/6\s*\/\s*3/);
  expect(texts[2]).toMatch(/7\s*\/\s*3/);
});

test("numeração de páginas: sem violações críticas de acessibilidade", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Numeração de páginas", exact: true }).first().click();
  await page.setInputFiles('input[type="file"]', FIXTURE_3);
  await expect(page.getByText("sintetico-3-paginas.pdf")).toBeVisible({ timeout: 15_000 });
  const results = await new AxeBuilder({ page }).analyze();
  const critical = results.violations.filter((v) => v.impact === "critical");
  expect(critical).toEqual([]);
});
