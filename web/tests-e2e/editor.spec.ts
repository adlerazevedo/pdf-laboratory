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

test("editar PDF: adiciona texto e retângulo, desfaz uma ação, salva e o resultado reabre com o objeto restante", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Editar PDF", exact: true }).first().click();
  await page.setInputFiles('input[type="file"]', FIXTURE_3);
  await expect(page.getByText("Página 1")).toBeVisible({ timeout: 15_000 });

  const pageCanvas = page.locator("#editor-page-0");
  await expect(pageCanvas).toBeVisible();

  // adiciona um objeto de texto clicando no modo "Texto" e depois na página
  await page.getByRole("button", { name: "Texto", exact: true }).click();
  await pageCanvas.click({ position: { x: 60, y: 60 } });

  // a caixa de propriedades deve mostrar o texto padrão do objeto recém-criado
  const textArea = page.locator("#EditorPropertiesPanel textarea");
  await expect(textArea).toHaveValue("Novo texto");
  await textArea.fill("TEXTO ADICIONADO PELO TESTE");

  // adiciona um retângulo em modo separado (objeto que será desfeito em seguida)
  await page.getByRole("button", { name: "Retângulo", exact: true }).click();
  await pageCanvas.click({ position: { x: 200, y: 200 } });
  await expect(page.getByRole("button", { name: "Desfazer" })).toBeEnabled();

  // desfaz a criação do retângulo — deve sobrar só o objeto de texto
  await page.getByRole("button", { name: "Desfazer" }).click();

  await page.getByRole("button", { name: "Salvar como novo PDF", exact: true }).click();
  await expect(page.getByText("Concluído")).toBeVisible({ timeout: 15_000 });

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Baixar", exact: true }).click(),
  ]);

  const bytes = await readDownloadBytes(download);
  const { PDFDocument, PDFDict, PDFName } = await import("pdf-lib");
  const doc = await PDFDocument.load(bytes);
  expect(doc.getPageCount()).toBe(3);

  const firstPage = doc.getPages()[0];
  const resources = firstPage.node.get(PDFName.of("Resources"));
  expect(resources).toBeInstanceOf(PDFDict);
  const fontDict = (resources as InstanceType<typeof PDFDict>).get(PDFName.of("Font"));
  expect(fontDict).toBeInstanceOf(PDFDict);

  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(bytes), useWorkerFetch: false, isEvalSupported: false });
  const jsDoc = await loadingTask.promise;
  const jsPage = await jsDoc.getPage(1);
  const content = await jsPage.getTextContent();
  const fullText = content.items.map((it: { str?: string }) => it.str ?? "").join(" ");
  expect(fullText).toContain("TEXTO ADICIONADO PELO TESTE");
});

test("editar PDF: sem violações críticas de acessibilidade", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Editar PDF", exact: true }).first().click();
  await page.setInputFiles('input[type="file"]', FIXTURE_3);
  await expect(page.getByText("Página 1")).toBeVisible({ timeout: 15_000 });
  const results = await new AxeBuilder({ page }).analyze();
  const critical = results.violations.filter((v) => v.impact === "critical");
  expect(critical).toEqual([]);
});
