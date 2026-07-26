import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const FIXTURE_10 = join(import.meta.dirname, "../../shared/test-fixtures/generated/sintetico-10-paginas.pdf");

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

test("extrair páginas: extrai um intervalo não-contíguo e o resultado tem exatamente essas páginas, na ordem pedida", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Extrair páginas", exact: true }).first().click();
  await page.setInputFiles('input[type="file"]', FIXTURE_10);
  await expect(page.getByText("— 10 páginas")).toBeVisible({ timeout: 15_000 });

  await page.getByLabel(/Páginas a extrair/).fill("2,5,8-9");

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Extrair", exact: true }).click().then(async () => {
      await expect(page.getByText("Concluído")).toBeVisible({ timeout: 15_000 });
      await page.getByRole("button", { name: "Baixar", exact: true }).click();
    }),
  ]);
  expect(download.suggestedFilename()).toMatch(/-extraido\.pdf$/);

  const bytes = await readDownloadBytes(download);
  const { PDFDocument } = await import("pdf-lib");
  const doc = await PDFDocument.load(bytes);
  expect(doc.getPageCount()).toBe(4);

  const texts = await extractPageTexts(bytes);
  expect(texts[0]).toMatch(/Pagina 2 de 10/);
  expect(texts[1]).toMatch(/Pagina 5 de 10/);
  expect(texts[2]).toMatch(/Pagina 8 de 10/);
  expect(texts[3]).toMatch(/Pagina 9 de 10/);
});

test("extrair páginas: intervalo inválido mostra erro e não gera arquivo", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Extrair páginas", exact: true }).first().click();
  await page.setInputFiles('input[type="file"]', FIXTURE_10);
  await expect(page.getByText("— 10 páginas")).toBeVisible({ timeout: 15_000 });

  await page.getByLabel(/Páginas a extrair/).fill("99");
  await page.getByRole("button", { name: "Extrair", exact: true }).click();
  await expect(page.getByRole("alert")).toBeVisible();
});

test("extrair páginas: sem violações críticas de acessibilidade", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Extrair páginas", exact: true }).first().click();
  await page.setInputFiles('input[type="file"]', FIXTURE_10);
  await expect(page.getByText("— 10 páginas")).toBeVisible({ timeout: 15_000 });
  const results = await new AxeBuilder({ page }).analyze();
  const critical = results.violations.filter((v) => v.impact === "critical");
  expect(critical).toEqual([]);
});
