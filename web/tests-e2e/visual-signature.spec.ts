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

async function pageHasEmbeddedImage(pdfDoc: import("pdf-lib").PDFDocument, pageIndex: number): Promise<boolean> {
  const { PDFName, PDFDict } = await import("pdf-lib");
  const page = pdfDoc.getPage(pageIndex);
  const resources = page.node.Resources();
  const xObject = resources?.lookup(PDFName.of("XObject"));
  if (!xObject || !(xObject instanceof PDFDict)) return false;
  return xObject.keys().length > 0;
}

const FIXTURE = join(import.meta.dirname, "../../shared/test-fixtures/generated/sintetico-3-paginas.pdf");

test("assinatura visual: modo texto, aplicada só na primeira página, baixa o resultado", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Assinatura visual (carimbo)", exact: true }).first().click();
  await page.setInputFiles('input[type="file"]', FIXTURE);
  await expect(page.getByText("3 páginas")).toBeVisible({ timeout: 15_000 });

  await page.getByText("Apenas a primeira", { exact: true }).click();

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Aplicar assinatura visual", exact: true }).click().then(async () => {
      await expect(page.getByText("Concluído")).toBeVisible({ timeout: 15_000 });
      await page.getByRole("button", { name: "Baixar", exact: true }).click();
    }),
  ]);
  expect(download.suggestedFilename()).toMatch(/-assinado-visualmente\.pdf$/);

  // Integridade real: o carimbo de texto aparece SÓ na primeira página —
  // as outras duas permanecem com apenas o conteúdo original.
  const bytes = await readDownloadBytes(download);
  const texts = await extractPageTexts(bytes);
  expect(texts[0]).toContain("Assinado eletronicamente");
  expect(texts[0]).toMatch(/Pagina 1 de 3/);
  expect(texts[1]).not.toContain("Assinado eletronicamente");
  expect(texts[2]).not.toContain("Assinado eletronicamente");
});

test("assinatura visual: modo desenhar, captura o traço como imagem e aplica", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Assinatura visual (carimbo)", exact: true }).first().click();
  await page.setInputFiles('input[type="file"]', FIXTURE);
  await expect(page.getByText("3 páginas")).toBeVisible({ timeout: 15_000 });

  await page.getByLabel("Tipo de carimbo").selectOption("draw");
  const canvas = page.locator('canvas[aria-label="Área para desenhar a assinatura"]');
  const box = await canvas.boundingBox();
  if (!box) throw new Error("canvas não encontrado");
  await page.mouse.move(box.x + 20, box.y + 80);
  await page.mouse.down();
  await page.mouse.move(box.x + 100, box.y + 40, { steps: 5 });
  await page.mouse.move(box.x + 200, box.y + 100, { steps: 5 });
  await page.mouse.up();

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Aplicar assinatura visual", exact: true }).click().then(async () => {
      await expect(page.getByText("Concluído")).toBeVisible({ timeout: 15_000 });
      await page.getByRole("button", { name: "Baixar", exact: true }).click();
    }),
  ]);
  expect(download.suggestedFilename()).toMatch(/-assinado-visualmente\.pdf$/);

  // Integridade real: o traço desenhado é aplicado como imagem embutida de
  // verdade (não como texto) — confere que uma imagem foi de fato anexada
  // aos recursos de ao menos uma página (o padrão é aplicar em todas).
  const bytes = await readDownloadBytes(download);
  const { PDFDocument } = await import("pdf-lib");
  const doc = await PDFDocument.load(bytes);
  const pagesWithImage = await Promise.all(
    Array.from({ length: doc.getPageCount() }, (_, i) => pageHasEmbeddedImage(doc, i)),
  );
  expect(pagesWithImage.some(Boolean)).toBe(true);
});

test("assinatura visual: intervalo de páginas inválido mostra erro e bloqueia o envio", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Assinatura visual (carimbo)", exact: true }).first().click();
  await page.setInputFiles('input[type="file"]', FIXTURE);
  await expect(page.getByText("3 páginas")).toBeVisible({ timeout: 15_000 });

  await page.getByText("Intervalo personalizado", { exact: true }).click();
  await page.getByPlaceholder("ex.: 1-3, 5").fill("99");
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page.getByRole("button", { name: "Aplicar assinatura visual", exact: true })).toBeDisabled();
});

test("assinatura visual: aviso de que não é assinatura digital está sempre visível", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Assinatura visual (carimbo)", exact: true }).first().click();
  await expect(page.getByText("Isto NÃO é uma assinatura digital")).toBeVisible();
  await expect(page.getByText(/nunca solicita nem processa arquivos PFX\/P12/)).toBeVisible();
});

test("assinatura visual: sem violações críticas de acessibilidade", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Assinatura visual (carimbo)", exact: true }).first().click();
  await page.setInputFiles('input[type="file"]', FIXTURE);
  await expect(page.getByText("3 páginas")).toBeVisible({ timeout: 15_000 });
  const results = await new AxeBuilder({ page }).analyze();
  const critical = results.violations.filter((v) => v.impact === "critical");
  expect(critical).toEqual([]);
});

test("assinatura visual: opção 'incluir data/hora' anexa timestamp ao texto do carimbo", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Assinatura visual (carimbo)", exact: true }).first().click();
  await page.setInputFiles('input[type="file"]', FIXTURE);
  await expect(page.getByText("3 páginas")).toBeVisible({ timeout: 15_000 });

  await page.getByLabel("Incluir data/hora atual no texto").check();
  await page.getByText("Apenas a primeira", { exact: true }).click();

  await page.getByRole("button", { name: "Aplicar assinatura visual", exact: true }).click();
  await expect(page.getByText("Concluído")).toBeVisible({ timeout: 15_000 });
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Baixar", exact: true }).click(),
  ]);

  const bytes = await readDownloadBytes(download);
  const texts = await extractPageTexts(bytes);
  expect(texts[0]).toContain("Assinado eletronicamente —");
  expect(texts[0]).toMatch(/\d{4}/);
});

test("assinatura visual: arrastar a prévia define uma âncora livre, e 'redefinir' volta ao preset", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Assinatura visual (carimbo)", exact: true }).first().click();
  await page.setInputFiles('input[type="file"]', FIXTURE);
  await expect(page.getByText("3 páginas")).toBeVisible({ timeout: 15_000 });

  const preview = page.locator("#SignaturePreviewPage");
  await expect(preview).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole("button", { name: "Redefinir para posição predefinida", exact: true })).toHaveCount(0);

  const box = await preview.boundingBox();
  if (!box) throw new Error("preview bounding box unavailable");
  await page.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.3);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.6, box.y + box.height * 0.5, { steps: 5 });
  await page.mouse.up();

  await expect(page.getByRole("button", { name: "Redefinir para posição predefinida", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Redefinir para posição predefinida", exact: true }).click();
  await expect(page.getByRole("button", { name: "Redefinir para posição predefinida", exact: true })).toHaveCount(0);
});

test("assinatura visual: aplica com rotação sem erro e o resultado é baixado normalmente", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Assinatura visual (carimbo)", exact: true }).first().click();
  await page.setInputFiles('input[type="file"]', FIXTURE);
  await expect(page.getByText("3 páginas")).toBeVisible({ timeout: 15_000 });

  const rotationSlider = page.getByRole("slider", { name: /Rotação/ });
  await rotationSlider.fill("45");

  await page.getByRole("button", { name: "Aplicar assinatura visual", exact: true }).click();
  await expect(page.getByText("Concluído")).toBeVisible({ timeout: 15_000 });
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Baixar", exact: true }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/-assinado-visualmente\.pdf$/);
});
