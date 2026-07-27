import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFileSync } from "node:fs";
import { join } from "node:path";

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

const FIXTURE = join(import.meta.dirname, "../../shared/test-fixtures/generated/sintetico-3-paginas.pdf");

test("organizar páginas: miniaturas, rotação, duplicação, exclusão, página em branco, desfazer e salvar", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Organizar páginas" }).first().click();
  await page.setInputFiles('input[type="file"]', FIXTURE);

  await expect(page.getByRole("button", { name: "Selecionar todas" })).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('[role="checkbox"]')).toHaveCount(3);

  await page.getByRole("button", { name: "Girar página 1" }).click();
  await page.getByRole("button", { name: "Duplicar página 2" }).click();
  await expect(page.locator('[role="checkbox"]')).toHaveCount(4);

  await page.getByRole("button", { name: "Inserir página em branco" }).click();
  await expect(page.locator('[role="checkbox"]')).toHaveCount(5);

  await page.getByRole("button", { name: "Excluir página 1" }).click();
  await expect(page.locator('[role="checkbox"]')).toHaveCount(4);

  await page.getByRole("button", { name: "Desfazer" }).click();
  await expect(page.locator('[role="checkbox"]')).toHaveCount(5);

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Salvar como novo PDF" }).click().then(async () => {
      await expect(page.getByText("Concluído")).toBeVisible({ timeout: 15_000 });
      await page.getByRole("button", { name: "Baixar" }).click();
    }),
  ]);
  expect(download.suggestedFilename()).toMatch(/organizado\.pdf$/);

  // Integridade real do arquivo baixado, refletindo exatamente as ações
  // feitas acima: girar P1, duplicar P2 (inserida logo após), inserir página
  // em branco no fim, excluir P1, desfazer -> ordem final esperada:
  // [P1(rotacionada 90°), P2, cópia de P2, P3, página em branco].
  const bytes = await readDownloadBytes(download);
  const { PDFDocument } = await import("pdf-lib");
  const doc = await PDFDocument.load(bytes);
  expect(doc.getPageCount()).toBe(5);
  expect(doc.getPage(0).getRotation().angle).toBe(90);

  const texts = await extractPageTexts(bytes);
  expect(texts[0]).toMatch(/Pagina 1 de 3/);
  expect(texts[1]).toMatch(/Pagina 2 de 3/);
  expect(texts[2]).toMatch(/Pagina 2 de 3/); // cópia da página 2
  expect(texts[3]).toMatch(/Pagina 3 de 3/);
  expect(texts[4].trim()).toBe(""); // página inserida em branco
});

test("organizar páginas: bloqueia salvar quando todas as páginas são excluídas", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Organizar páginas" }).first().click();
  await page.setInputFiles('input[type="file"]', FIXTURE.replace("3-paginas", "1-pagina"));
  await expect(page.getByRole("button", { name: "Selecionar todas" })).toBeVisible({ timeout: 15_000 });
  await page.getByRole("button", { name: "Excluir página 1" }).click();
  await page.getByRole("button", { name: "Salvar como novo PDF" }).click();
  await expect(page.getByText(/não é possível salvar um pdf sem nenhuma página/i)).toBeVisible();
});

test("organizar páginas: sem violações críticas de acessibilidade", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Organizar páginas" }).first().click();
  await page.setInputFiles('input[type="file"]', FIXTURE);
  await expect(page.getByRole("button", { name: "Selecionar todas" })).toBeVisible({ timeout: 15_000 });
  const results = await new AxeBuilder({ page }).analyze();
  const critical = results.violations.filter((v) => v.impact === "critical");
  expect(critical).toEqual([]);
});
