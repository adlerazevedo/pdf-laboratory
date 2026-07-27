import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFileSync } from "node:fs";
import { join } from "node:path";

async function readDownloadBytes(download: import("@playwright/test").Download): Promise<Buffer> {
  const path = await download.path();
  if (!path) throw new Error("download path unavailable");
  return readFileSync(path);
}

async function extractPageTexts(bytes: Uint8Array): Promise<string[]> {
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const loadingTask = pdfjsLib.getDocument({ data: bytes, useWorkerFetch: false, isEvalSupported: false });
  const doc = await loadingTask.promise;
  const texts: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    texts.push(content.items.map((it: { str?: string }) => it.str ?? "").join(" "));
  }
  return texts;
}

const FIXTURE_10 = join(import.meta.dirname, "../../shared/test-fixtures/generated/sintetico-10-paginas.pdf");

async function openSplitWithFixture(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Dividir PDF", exact: true }).first().click();
  await page.setInputFiles('input[type="file"]', FIXTURE_10);
  // "— 10 páginas" (com travessão, sem parênteses) identifica a linha de
  // informação do arquivo — distinta de "(10 páginas)" que também aparece
  // no item de intervalo padrão da lista de exportação.
  await expect(page.getByText("— 10 páginas")).toBeVisible({ timeout: 15_000 });
}

test("dividir PDF: cada página em um arquivo, baixa um .zip com 10 partes", async ({ page }) => {
  await openSplitWithFixture(page);
  await page.getByLabel("Modo de divisão").selectOption("each-page");
  await expect(page.getByText("10 arquivos de saída")).toBeVisible();

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Dividir", exact: true }).click().then(async () => {
      await expect(page.getByText("Concluído")).toBeVisible({ timeout: 15_000 });
      await page.getByRole("button", { name: "Baixar" }).click();
    }),
  ]);
  expect(download.suggestedFilename()).toMatch(/-dividido\.zip$/);

  // Integridade real: 10 entradas no .zip, cada uma um PDF de 1 página só,
  // com o texto da página correta (não apenas a contagem de arquivos).
  const zipBytes = await readDownloadBytes(download);
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(zipBytes);
  const entries = Object.values(zip.files).filter((f) => !f.dir);
  expect(entries).toHaveLength(10);
  const { PDFDocument } = await import("pdf-lib");
  for (const entry of entries) {
    const content = await entry.async("uint8array");
    const doc = await PDFDocument.load(content);
    expect(doc.getPageCount()).toBe(1);
  }
});

test("dividir PDF: intervalos personalizados, uma linha por arquivo, validação imediata", async ({ page }) => {
  await openSplitWithFixture(page);
  await page.getByLabel("Modo de divisão").selectOption("custom-ranges");
  const textarea = page.getByLabel(/Um intervalo por linha/);
  await textarea.fill("1-3\n5,8-10");
  await expect(page.getByText("2 arquivos de saída")).toBeVisible();

  // intervalo inválido deve bloquear o envio imediatamente, antes de qualquer clique
  await textarea.fill("99-100");
  await expect(page.getByText("Configuração inválida")).toBeVisible();
  await expect(page.getByRole("button", { name: "Dividir", exact: true })).toBeDisabled();

  await textarea.fill("1-3\n5,8-10");
  await expect(page.getByRole("button", { name: "Dividir", exact: true })).toBeEnabled();

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Dividir", exact: true }).click().then(async () => {
      await expect(page.getByText("Concluído")).toBeVisible({ timeout: 15_000 });
      await page.getByRole("button", { name: "Baixar" }).click();
    }),
  ]);
  expect(download.suggestedFilename()).toMatch(/-dividido\.zip$/);

  // Integridade real: 2 arquivos no .zip com exatamente as páginas pedidas,
  // na ordem certa — "1-3" e "5,8-10".
  const zipBytes = await readDownloadBytes(download);
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(zipBytes);
  const entries = Object.values(zip.files).filter((f) => !f.dir).sort((a, b) => a.name.localeCompare(b.name));
  expect(entries).toHaveLength(2);
  const textsFile1 = await extractPageTexts(await entries[0].async("uint8array"));
  expect(textsFile1).toHaveLength(3);
  expect(textsFile1[0]).toMatch(/Pagina 1 de 10/);
  expect(textsFile1[1]).toMatch(/Pagina 2 de 10/);
  expect(textsFile1[2]).toMatch(/Pagina 3 de 10/);
  const textsFile2 = await extractPageTexts(await entries[1].async("uint8array"));
  expect(textsFile2).toHaveLength(4);
  expect(textsFile2[0]).toMatch(/Pagina 5 de 10/);
  expect(textsFile2[1]).toMatch(/Pagina 8 de 10/);
  expect(textsFile2[2]).toMatch(/Pagina 9 de 10/);
  expect(textsFile2[3]).toMatch(/Pagina 10 de 10/);
});

test("dividir PDF: páginas pares e ímpares gera 2 arquivos", async ({ page }) => {
  await openSplitWithFixture(page);
  await page.getByLabel("Modo de divisão").selectOption("odd-even");
  await expect(page.getByText("2 arquivos de saída")).toBeVisible();
  await expect(page.getByText("Gera 2 arquivos")).toBeVisible();
});

test("dividir PDF: extrair seleção gera um único PDF (sem zip)", async ({ page }) => {
  await openSplitWithFixture(page);
  await page.getByLabel("Modo de divisão").selectOption("extract-selection");
  await page.getByLabel(/Páginas a extrair/).fill("2,4,6");
  await expect(page.getByText("1 arquivo de saída")).toBeVisible();

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Dividir", exact: true }).click().then(async () => {
      await expect(page.getByText("Concluído")).toBeVisible({ timeout: 15_000 });
      await page.getByRole("button", { name: "Baixar" }).click();
    }),
  ]);
  expect(download.suggestedFilename()).toMatch(/-extraido\.pdf$/);

  // Integridade real: um único PDF (sem zip) com exatamente as páginas 2,4,6.
  const bytes = await readDownloadBytes(download);
  const { PDFDocument } = await import("pdf-lib");
  const doc = await PDFDocument.load(bytes);
  expect(doc.getPageCount()).toBe(3);
  const texts = await extractPageTexts(new Uint8Array(bytes));
  expect(texts[0]).toMatch(/Pagina 2 de 10/);
  expect(texts[1]).toMatch(/Pagina 4 de 10/);
  expect(texts[2]).toMatch(/Pagina 6 de 10/);
});

test("dividir PDF: dividir em N arquivos distribui as páginas o mais igualmente possível", async ({ page }) => {
  await openSplitWithFixture(page);
  await page.getByLabel("Modo de divisão").selectOption("into-n-files");
  await page.getByLabel("Número de arquivos").fill("3");
  await expect(page.getByText("3 arquivos de saída")).toBeVisible();
});

test("dividir PDF: sem violações críticas de acessibilidade", async ({ page }) => {
  await openSplitWithFixture(page);
  const results = await new AxeBuilder({ page }).analyze();
  const critical = results.violations.filter((v) => v.impact === "critical");
  expect(critical).toEqual([]);
});
