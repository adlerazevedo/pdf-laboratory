import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFileSync } from "node:fs";

async function readDownloadBytes(download: import("@playwright/test").Download): Promise<Buffer> {
  const path = await download.path();
  if (!path) throw new Error("download path unavailable");
  return readFileSync(path);
}

async function makeFixtureBuffer(): Promise<Buffer> {
  const { PDFDocument, StandardFonts } = await import("pdf-lib");
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const page1 = doc.addPage([400, 300]);
  page1.drawText("CPF do titular: 123.456.789-09", { x: 30, y: 250, size: 14, font });
  const page2 = doc.addPage([400, 300]);
  page2.drawText("Pagina publica sem dados sensiveis", { x: 30, y: 250, size: 14, font });
  const bytes = await doc.save();
  return Buffer.from(bytes);
}

test("redação segura: detecta CPF automaticamente, aplica e o texto some da página marcada sem afetar a outra", async ({ page }) => {
  const buffer = await makeFixtureBuffer();
  await page.goto("/");
  await page.getByRole("button", { name: "Redação segura", exact: true }).first().click();
  await page.setInputFiles('input[type="file"]', { name: "sintetico-cpf.pdf", mimeType: "application/pdf", buffer });

  await expect(page.getByText(/Ocorrências detectadas automaticamente/)).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText("123.456.789-09")).toBeVisible();

  await page.getByRole("button", { name: "Aplicar redação", exact: true }).click();
  await expect(page.getByText("Concluído")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText(/nenhum texto encontrado nas páginas redigidas/)).toBeVisible();

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Baixar", exact: true }).click(),
  ]);
  const bytes = await readDownloadBytes(download);

  const { PDFDocument } = await import("pdf-lib");
  const doc = await PDFDocument.load(bytes);
  expect(doc.getPageCount()).toBe(2);

  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(bytes), useWorkerFetch: false, isEvalSupported: false });
  const jsDoc = await loadingTask.promise;

  const redactedPage = await jsDoc.getPage(1);
  const redactedContent = await redactedPage.getTextContent();
  expect(redactedContent.items).toHaveLength(0);

  const untouchedPage = await jsDoc.getPage(2);
  const untouchedContent = await untouchedPage.getTextContent();
  const untouchedText = untouchedContent.items.map((it: unknown) => (it as { str?: string }).str ?? "").join(" ");
  expect(untouchedText).toContain("Pagina publica sem dados sensiveis");
});

test("redação segura: sem violações críticas de acessibilidade", async ({ page }) => {
  const buffer = await makeFixtureBuffer();
  await page.goto("/");
  await page.getByRole("button", { name: "Redação segura", exact: true }).first().click();
  await page.setInputFiles('input[type="file"]', { name: "sintetico-cpf.pdf", mimeType: "application/pdf", buffer });
  await expect(page.getByText(/Ocorrências detectadas automaticamente/)).toBeVisible({ timeout: 15_000 });
  const results = await new AxeBuilder({ page }).analyze();
  const critical = results.violations.filter((v) => v.impact === "critical");
  expect(critical).toEqual([]);
});
