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

test("ferramentas de página avançadas: aplica numeração Bates e um marcador, salva e ambos estão realmente presentes no PDF resultante", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Ferramentas de página avançadas", exact: true }).first().click();
  await page.setInputFiles('input[type="file"]', FIXTURE_3);
  await expect(page.getByText("sintetico-3-paginas.pdf")).toBeVisible({ timeout: 15_000 });

  await page.getByLabel("Aplicar identificador sequencial (ex.: DOC000001)").check();
  await page.getByLabel("Prefixo").fill("TESTE");
  await page.getByLabel("Início").fill("500");
  await page.getByLabel("Dígitos").fill("4");

  const bookmarkFieldset = page.locator("fieldset", { hasText: "Marcadores (bookmarks)" });
  await bookmarkFieldset.getByLabel("Título").fill("Marcador de teste");
  await bookmarkFieldset.getByLabel("Página", { exact: true }).fill("2");
  await bookmarkFieldset.getByRole("button", { name: "Adicionar", exact: true }).click();
  await expect(page.getByText('"Marcador de teste" → página 2')).toBeVisible();

  await page.getByRole("button", { name: "Aplicar", exact: true }).click();
  await expect(page.getByText("Concluído")).toBeVisible({ timeout: 15_000 });

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Baixar", exact: true }).click(),
  ]);

  const bytes = await readDownloadBytes(download);
  const { readBookmarks } = await import("../src/lib/pdf/pageAdvanced");
  const bookmarks = await readBookmarks(new Uint8Array(bytes));
  expect(bookmarks).toEqual([{ title: "Marcador de teste", pageIndex: 1 }]);

  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(bytes), useWorkerFetch: false, isEvalSupported: false });
  const doc = await loadingTask.promise;
  const firstPage = await doc.getPage(1);
  const content = await firstPage.getTextContent();
  const text = content.items.map((it: { str?: string }) => it.str ?? "").join(" ");
  expect(text).toContain("TESTE0500");
});

test("ferramentas de página avançadas: sem violações críticas de acessibilidade", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Ferramentas de página avançadas", exact: true }).first().click();
  await page.setInputFiles('input[type="file"]', FIXTURE_3);
  await expect(page.getByText("sintetico-3-paginas.pdf")).toBeVisible({ timeout: 15_000 });
  const results = await new AxeBuilder({ page }).analyze();
  const critical = results.violations.filter((v) => v.impact === "critical");
  expect(critical).toEqual([]);
});
