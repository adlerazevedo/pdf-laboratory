import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const FIXTURE_1 = join(import.meta.dirname, "../../shared/test-fixtures/generated/sintetico-1-pagina.pdf");

async function readDownloadBytes(download: import("@playwright/test").Download): Promise<Buffer> {
  const path = await download.path();
  if (!path) throw new Error("download path unavailable");
  return readFileSync(path);
}

test("metadados: título, autor, assunto e palavras-chave são gravados de verdade no PDF baixado", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Metadados", exact: true }).first().click();
  await page.setInputFiles('input[type="file"]', FIXTURE_1);
  await expect(page.getByText("sintetico-1-pagina.pdf")).toBeVisible({ timeout: 15_000 });

  await page.getByLabel("Título").fill("Relatorio de Teste");
  await page.getByLabel("Autor").fill("Laboratorio PDF");
  await page.getByLabel("Assunto").fill("Verificacao automatizada");
  await page.getByLabel("Palavras-chave (separadas por vírgula)").fill("alpha, beta, gamma");

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Salvar", exact: true }).click().then(async () => {
      await expect(page.getByText("Concluído")).toBeVisible({ timeout: 15_000 });
      await page.getByRole("button", { name: "Baixar", exact: true }).click();
    }),
  ]);
  expect(download.suggestedFilename()).toMatch(/-metadados\.pdf$/);

  const bytes = await readDownloadBytes(download);
  const { PDFDocument } = await import("pdf-lib");
  const doc = await PDFDocument.load(bytes);
  expect(doc.getTitle()).toBe("Relatorio de Teste");
  expect(doc.getAuthor()).toBe("Laboratorio PDF");
  expect(doc.getSubject()).toBe("Verificacao automatizada");
  expect(doc.getKeywords()).toBe("alpha beta gamma");
});

test("metadados: campos deixados em branco não quebram o salvamento", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Metadados", exact: true }).first().click();
  await page.setInputFiles('input[type="file"]', FIXTURE_1);
  await expect(page.getByText("sintetico-1-pagina.pdf")).toBeVisible({ timeout: 15_000 });

  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  await expect(page.getByText("Concluído")).toBeVisible({ timeout: 15_000 });
});

test("metadados: sem violações críticas de acessibilidade", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Metadados", exact: true }).first().click();
  await page.setInputFiles('input[type="file"]', FIXTURE_1);
  await expect(page.getByText("sintetico-1-pagina.pdf")).toBeVisible({ timeout: 15_000 });
  const results = await new AxeBuilder({ page }).analyze();
  const critical = results.violations.filter((v) => v.impact === "critical");
  expect(critical).toEqual([]);
});
