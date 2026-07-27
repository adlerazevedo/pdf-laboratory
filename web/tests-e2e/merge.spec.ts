import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const FIXTURE_1 = join(import.meta.dirname, "../../shared/test-fixtures/generated/sintetico-1-pagina.pdf");
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

test("unir PDFs: combina dois arquivos na ordem de envio e o resultado tem o conteúdo real de cada um", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Unir PDFs", exact: true }).first().click();
  await page.setInputFiles('input[type="file"]', [FIXTURE_1, FIXTURE_3]);
  await expect(page.getByText("sintetico-1-pagina.pdf")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText("sintetico-3-paginas.pdf")).toBeVisible();

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: /^Unir \(/ }).click().then(async () => {
      await expect(page.getByText("Concluído")).toBeVisible({ timeout: 15_000 });
      await page.getByRole("button", { name: "Baixar", exact: true }).click();
    }),
  ]);
  expect(download.suggestedFilename()).toBe("documento-unido.pdf");

  const bytes = await readDownloadBytes(download);
  // Integridade real do arquivo baixado: 1 + 3 = 4 páginas, na ordem de envio.
  const { PDFDocument } = await import("pdf-lib");
  const doc = await PDFDocument.load(bytes);
  expect(doc.getPageCount()).toBe(4);

  const texts = await extractPageTexts(bytes);
  expect(texts[0]).toMatch(/Pagina 1 de 1/);
  expect(texts[1]).toMatch(/Pagina 1 de 3/);
  expect(texts[2]).toMatch(/Pagina 2 de 3/);
  expect(texts[3]).toMatch(/Pagina 3 de 3/);
});

test("unir PDFs: mover um arquivo para cima muda a ordem final das páginas", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Unir PDFs", exact: true }).first().click();
  await page.setInputFiles('input[type="file"]', [FIXTURE_1, FIXTURE_3]);
  await expect(page.getByText("sintetico-1-pagina.pdf")).toBeVisible({ timeout: 15_000 });

  // sintetico-3-paginas.pdf está na posição 2 — move para cima, invertendo a ordem.
  await page.getByRole("button", { name: "Mover para cima" }).nth(1).click();

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: /^Unir \(/ }).click().then(async () => {
      await expect(page.getByText("Concluído")).toBeVisible({ timeout: 15_000 });
      await page.getByRole("button", { name: "Baixar", exact: true }).click();
    }),
  ]);
  const bytes = await readDownloadBytes(download);
  const texts = await extractPageTexts(bytes);
  expect(texts[0]).toMatch(/Pagina 1 de 3/);
  expect(texts[3]).toMatch(/Pagina 1 de 1/);
});

test("unir PDFs: botão fica desabilitado com menos de 2 arquivos", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Unir PDFs", exact: true }).first().click();
  await page.setInputFiles('input[type="file"]', [FIXTURE_1]);
  await expect(page.getByText("sintetico-1-pagina.pdf")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("button", { name: /^Unir \(/ })).toBeDisabled();
});

test("unir PDFs: sem violações críticas de acessibilidade", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Unir PDFs", exact: true }).first().click();
  await page.setInputFiles('input[type="file"]', [FIXTURE_1, FIXTURE_3]);
  await expect(page.getByText("sintetico-1-pagina.pdf")).toBeVisible({ timeout: 15_000 });
  const results = await new AxeBuilder({ page }).analyze();
  const critical = results.violations.filter((v) => v.impact === "critical");
  expect(critical).toEqual([]);
});
