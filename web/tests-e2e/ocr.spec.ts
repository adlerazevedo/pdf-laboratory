import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { PDFDocument } from "pdf-lib";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// PNG 1x1 sintético reaproveitado dos outros specs — só para os testes que
// não dependem de reconhecimento real de texto (validação/acessibilidade).
const TINY_PNG_B64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

async function writeTinyFixture(): Promise<string> {
  const png = Buffer.from(TINY_PNG_B64, "base64");
  const doc = await PDFDocument.create();
  const img = await doc.embedPng(png);
  const page = doc.addPage([100, 100]);
  page.drawImage(img, { x: 0, y: 0, width: 100, height: 100 });
  const bytes = await doc.save();
  const dir = mkdtempSync(join(tmpdir(), "pdflab-ocr-"));
  const path = join(dir, "ocr-fixture.pdf");
  writeFileSync(path, bytes);
  return path;
}

test("OCR: aviso de download de modelo e limitações fica visível antes de rodar", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "OCR (texto pesquisável)", exact: true }).first().click();
  await expect(page.getByText("Antes de começar: leia isto")).toBeVisible();
  await expect(page.getByText(/baixa o motor de OCR e o modelo do idioma/)).toBeVisible();
  await expect(page.getByText(/nunca o seu documento, que nunca sai do navegador/)).toBeVisible();
});

test("OCR: intervalo de páginas inválido mostra erro e bloqueia o envio", async ({ page }) => {
  const fixture = await writeTinyFixture();
  await page.goto("/");
  await page.getByRole("button", { name: "OCR (texto pesquisável)", exact: true }).first().click();
  await page.setInputFiles('input[type="file"]', fixture);
  await expect(page.getByText("1 páginas")).toBeVisible({ timeout: 15_000 });

  await page.getByText("Intervalo personalizado", { exact: true }).click();
  await page.getByPlaceholder("ex.: 1-3, 5").fill("99");
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page.getByRole("button", { name: "Executar OCR", exact: true })).toBeDisabled();
});

test("OCR: sem violações críticas de acessibilidade na tela inicial da ferramenta", async ({ page }) => {
  const fixture = await writeTinyFixture();
  await page.goto("/");
  await page.getByRole("button", { name: "OCR (texto pesquisável)", exact: true }).first().click();
  await page.setInputFiles('input[type="file"]', fixture);
  await expect(page.getByText("1 páginas")).toBeVisible({ timeout: 15_000 });
  const results = await new AxeBuilder({ page }).analyze();
  const critical = results.violations.filter((v) => v.impact === "critical");
  expect(critical).toEqual([]);
});

test("OCR: reconhece texto real de uma imagem e gera uma camada pesquisável", async ({ page }) => {
  test.setTimeout(90_000); // depende de rede real (CDN do Tesseract.js) — CI precisa de acesso à internet.

  // Gera uma imagem com texto grande e nítido, e a incorpora como página cheia
  // — evita depender de arquivos binários versionados no repositório.
  const canvas = await page.evaluateHandle(() => {
    const c = document.createElement("canvas");
    c.width = 1200;
    c.height = 400;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = "black";
    ctx.font = "bold 80px sans-serif";
    ctx.fillText("LABORATORIO PDF", 60, 220);
    return c.toDataURL("image/png");
  });
  const dataUrl = await canvas.jsonValue();
  const pngBytes = Buffer.from((dataUrl as string).split(",")[1], "base64");

  const doc = await PDFDocument.create();
  const img = await doc.embedPng(pngBytes);
  const pdfPage = doc.addPage([600, 200]);
  pdfPage.drawImage(img, { x: 0, y: 0, width: 600, height: 200 });
  const bytes = await doc.save();
  const dir = mkdtempSync(join(tmpdir(), "pdflab-ocr-real-"));
  const fixturePath = join(dir, "ocr-real.pdf");
  writeFileSync(fixturePath, bytes);

  await page.goto("/");
  await page.getByRole("button", { name: "OCR (texto pesquisável)", exact: true }).first().click();
  await page.setInputFiles('input[type="file"]', fixturePath);
  await expect(page.getByText("1 páginas")).toBeVisible({ timeout: 15_000 });

  const [download] = await Promise.all([
    page.waitForEvent("download", { timeout: 80_000 }),
    page.getByRole("button", { name: "Executar OCR", exact: true }).click().then(async () => {
      await expect(page.getByText("Concluído")).toBeVisible({ timeout: 75_000 });
      await page.getByRole("button", { name: "Baixar", exact: true }).click();
    }),
  ]);
  expect(download.suggestedFilename()).toMatch(/-pesquisavel\.pdf$/);

  const downloadPath = await download.path();
  const outBytes = downloadPath ? Buffer.from(require("node:fs").readFileSync(downloadPath)) : null;
  expect(outBytes).not.toBeNull();

  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(outBytes as Buffer), useWorkerFetch: false, isEvalSupported: false });
  const outDoc = await loadingTask.promise;
  const outPage = await outDoc.getPage(1);
  const textContent = await outPage.getTextContent();
  const extractedText = textContent.items.map((it: { str?: string }) => it.str ?? "").join(" ").toUpperCase();
  expect(extractedText).toMatch(/LABORAT|PDF/);
});
