import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFileSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

async function readDownloadBytes(download: import("@playwright/test").Download): Promise<Buffer> {
  const path = await download.path();
  if (!path) throw new Error("download path unavailable");
  return readFileSync(path);
}

async function writeFormFixture(): Promise<string> {
  const { PDFDocument, StandardFonts } = await import("pdf-lib");
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const page = doc.addPage([400, 300]);
  const form = doc.getForm();

  const nomeField = form.createTextField("nome");
  nomeField.addToPage(page, { x: 40, y: 240, width: 200, height: 20, font });
  nomeField.enableRequired();

  const aceiteField = form.createCheckBox("aceite");
  aceiteField.addToPage(page, { x: 40, y: 200, width: 16, height: 16 });

  const ufField = form.createDropdown("uf");
  ufField.addOptions(["SP", "RJ"]);
  ufField.addToPage(page, { x: 40, y: 160, width: 100, height: 20, font });

  const somenteLeitura = form.createTextField("bloqueado");
  somenteLeitura.addToPage(page, { x: 40, y: 120, width: 200, height: 20, font });
  somenteLeitura.setText("nao_deve_mudar");
  somenteLeitura.enableReadOnly();

  const bytes = await doc.save();
  const dir = mkdtempSync(join(tmpdir(), "pdflab-form-fill-"));
  const path = join(dir, "formulario-para-preencher.pdf");
  writeFileSync(path, bytes);
  return path;
}

test("preencher formulário: preenche texto, checkbox e combo, mantém campo somente leitura intacto, salva sem achatar", async ({ page }) => {
  const fixturePath = await writeFormFixture();

  await page.goto("/");
  await page.getByRole("button", { name: "Preencher formulário", exact: true }).first().click();
  await page.setInputFiles('input[type="file"]', fixturePath);
  await expect(page.getByText("Página 1", { exact: true })).toBeVisible({ timeout: 15_000 });

  await page.getByRole("textbox", { name: "nome", exact: true }).fill("Fulano de Tal");
  await page.getByRole("checkbox", { name: "Marcado", exact: true }).check();
  await page.getByRole("combobox", { name: "uf", exact: true }).selectOption("RJ");

  await expect(page.getByRole("button", { name: "Salvar PDF preenchido", exact: true })).toBeEnabled();
  await page.getByRole("button", { name: "Salvar PDF preenchido", exact: true }).click();
  await expect(page.getByText("Concluído")).toBeVisible({ timeout: 15_000 });

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Baixar", exact: true }).click(),
  ]);

  const bytes = await readDownloadBytes(download);
  const { PDFDocument } = await import("pdf-lib");
  const doc = await PDFDocument.load(bytes);
  const form = doc.getForm();
  expect(form.getTextField("nome").getText()).toBe("Fulano de Tal");
  expect(form.getCheckBox("aceite").isChecked()).toBe(true);
  expect(form.getDropdown("uf").getSelected()).toEqual(["RJ"]);
  // campo somente leitura nunca é oferecido como editável e permanece com o valor original
  expect(form.getTextField("bloqueado").getText()).toBe("nao_deve_mudar");
});

test("preencher formulário: bloqueia salvar enquanto um campo obrigatório estiver vazio", async ({ page }) => {
  const fixturePath = await writeFormFixture();

  await page.goto("/");
  await page.getByRole("button", { name: "Preencher formulário", exact: true }).first().click();
  await page.setInputFiles('input[type="file"]', fixturePath);
  await expect(page.getByText("Página 1", { exact: true })).toBeVisible({ timeout: 15_000 });

  await expect(page.getByRole("button", { name: "Salvar PDF preenchido", exact: true })).toBeDisabled();
  await page.getByRole("textbox", { name: "nome", exact: true }).fill("Preenchido");
  await expect(page.getByRole("button", { name: "Salvar PDF preenchido", exact: true })).toBeEnabled();
});

test("preencher formulário: achatar (flatten) faz o valor aparecer como texto pesquisável e remove os campos", async ({ page }) => {
  const fixturePath = await writeFormFixture();

  await page.goto("/");
  await page.getByRole("button", { name: "Preencher formulário", exact: true }).first().click();
  await page.setInputFiles('input[type="file"]', fixturePath);
  await expect(page.getByText("Página 1", { exact: true })).toBeVisible({ timeout: 15_000 });

  await page.getByRole("textbox", { name: "nome", exact: true }).fill("TEXTO ACHATADO NO TESTE");
  await page.getByLabel("Achatar (tornar somente leitura) ao salvar").check();

  await page.getByRole("button", { name: "Salvar PDF preenchido", exact: true }).click();
  await expect(page.getByText("Concluído")).toBeVisible({ timeout: 15_000 });

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Baixar", exact: true }).click(),
  ]);

  const bytes = await readDownloadBytes(download);
  const { PDFDocument } = await import("pdf-lib");
  const doc = await PDFDocument.load(bytes);
  expect(doc.getForm().getFields()).toHaveLength(0);

  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(bytes), useWorkerFetch: false, isEvalSupported: false });
  const jsDoc = await loadingTask.promise;
  const jsPage = await jsDoc.getPage(1);
  const content = await jsPage.getTextContent();
  const text = content.items.map((it: unknown) => (it as { str?: string }).str ?? "").join(" ");
  expect(text).toContain("TEXTO ACHATADO NO TESTE");
});

test("preencher formulário: sem violações críticas de acessibilidade", async ({ page }) => {
  const fixturePath = await writeFormFixture();
  await page.goto("/");
  await page.getByRole("button", { name: "Preencher formulário", exact: true }).first().click();
  await page.setInputFiles('input[type="file"]', fixturePath);
  await expect(page.getByText("Página 1", { exact: true })).toBeVisible({ timeout: 15_000 });
  const results = await new AxeBuilder({ page }).analyze();
  const critical = results.violations.filter((v) => v.impact === "critical");
  expect(critical).toEqual([]);
});
