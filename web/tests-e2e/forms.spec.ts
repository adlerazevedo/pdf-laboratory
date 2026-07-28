import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFileSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const FIXTURE_3 = join(import.meta.dirname, "../../shared/test-fixtures/generated/sintetico-3-paginas.pdf");

async function readDownloadBytes(download: import("@playwright/test").Download): Promise<Buffer> {
  const path = await download.path();
  if (!path) throw new Error("download path unavailable");
  return readFileSync(path);
}

async function writeLabeledFixture(): Promise<string> {
  const { PDFDocument, StandardFonts } = await import("pdf-lib");
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const page = doc.addPage([400, 300]);
  // "Nome:" perto do topo — deve gerar uma sugestão de campo de texto à direita.
  page.drawText("Nome:", { x: 40, y: 250, size: 12, font });
  // "CPF:" — deve gerar uma sugestão de campo do tipo cpf.
  page.drawText("CPF:", { x: 40, y: 210, size: 12, font });
  const bytes = await doc.save();
  const dir = mkdtempSync(join(tmpdir(), "pdflab-forms-detect-"));
  const path = join(dir, "formulario-com-rotulos.pdf");
  writeFileSync(path, bytes);
  return path;
}

test("formulários: cria um campo de texto obrigatório e um checkbox marcado, salva e ambos existem como AcroForm real no PDF resultante", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Formulários (AcroForm)", exact: true }).first().click();
  await page.setInputFiles('input[type="file"]', FIXTURE_3);
  await expect(page.getByText("Página 1")).toBeVisible({ timeout: 15_000 });

  const pageCanvas = page.locator("#form-page-0");
  await expect(pageCanvas).toBeVisible();

  // cria um campo de texto
  await page.getByLabel("Tipo de campo").selectOption("text");
  await pageCanvas.click({ position: { x: 60, y: 60 } });

  const nameInput = page.locator("#FormsPropertiesPanel input[type='text']").first();
  await expect(nameInput).toHaveValue("text_1");
  await nameInput.fill("nome_completo");
  await page.getByLabel("Obrigatório").check();

  // cria um checkbox marcado por padrão, em outro ponto da mesma página
  await page.getByLabel("Tipo de campo").selectOption("checkbox");
  await pageCanvas.click({ position: { x: 60, y: 140 } });
  await page.getByLabel("Marcado por padrão").check();

  await expect(page.getByText("Nomes de campo duplicados")).toHaveCount(0);

  await page.getByRole("button", { name: "Gerar PDF com formulário", exact: true }).click();
  await expect(page.getByText("Concluído")).toBeVisible({ timeout: 15_000 });

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Baixar", exact: true }).click(),
  ]);

  const bytes = await readDownloadBytes(download);
  const { PDFDocument } = await import("pdf-lib");
  const doc = await PDFDocument.load(bytes);
  const form = doc.getForm();

  const textField = form.getTextField("nome_completo");
  expect(textField.isRequired()).toBe(true);

  const checkbox = form.getCheckBox("checkbox_1");
  expect(checkbox.isChecked()).toBe(true);
});

test("formulários: nomes de campo duplicados bloqueiam o botão de salvar e mostram um aviso", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Formulários (AcroForm)", exact: true }).first().click();
  await page.setInputFiles('input[type="file"]', FIXTURE_3);
  await expect(page.getByText("Página 1")).toBeVisible({ timeout: 15_000 });

  const pageCanvas = page.locator("#form-page-0");
  await page.getByLabel("Tipo de campo").selectOption("text");
  await pageCanvas.click({ position: { x: 60, y: 60 } });
  await page.getByLabel("Tipo de campo").selectOption("text");
  await pageCanvas.click({ position: { x: 60, y: 140 } });

  const nameInputs = page.locator("#FormsPropertiesPanel input[type='text']").first();
  await nameInputs.fill("text_1");

  await expect(page.getByText("Nomes de campo duplicados")).toBeVisible();
  await expect(page.getByRole("button", { name: "Gerar PDF com formulário", exact: true })).toBeDisabled();
});

test("formulários: sem violações críticas de acessibilidade", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Formulários (AcroForm)", exact: true }).first().click();
  await page.setInputFiles('input[type="file"]', FIXTURE_3);
  await expect(page.getByText("Página 1")).toBeVisible({ timeout: 15_000 });
  const results = await new AxeBuilder({ page }).analyze();
  const critical = results.violations.filter((v) => v.impact === "critical");
  expect(critical).toEqual([]);
});

test("formulários: detecção automática sugere campos a partir de rótulos reais do PDF, e aceitar cria um AcroForm de verdade", async ({ page }) => {
  const fixturePath = await writeLabeledFixture();

  await page.goto("/");
  await page.getByRole("button", { name: "Formulários (AcroForm)", exact: true }).first().click();
  await page.setInputFiles('input[type="file"]', fixturePath);
  await expect(page.getByText("Página 1")).toBeVisible({ timeout: 15_000 });

  await page.getByRole("button", { name: "Detectar campos automaticamente", exact: true }).click();
  await expect(page.getByText(/Sugestões de campos detectados/)).toBeVisible({ timeout: 10_000 });

  // as duas sugestões esperadas devem aparecer na lista de revisão
  await expect(page.getByText('Página 1 · CPF · "CPF:"')).toBeVisible();
  await expect(page.getByText(/Página 1 · Texto ·/)).toBeVisible();

  await page.getByRole("button", { name: "Aceitar todas", exact: true }).click();
  await expect(page.getByText(/Sugestões de campos detectados/)).toHaveCount(0);

  await page.getByRole("button", { name: "Gerar PDF com formulário", exact: true }).click();
  await expect(page.getByText("Concluído")).toBeVisible({ timeout: 15_000 });

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Baixar", exact: true }).click(),
  ]);

  const bytes = await readDownloadBytes(download);
  const { PDFDocument } = await import("pdf-lib");
  const doc = await PDFDocument.load(bytes);
  const fieldNames = doc.getForm().getFields().map((f) => f.getName());
  expect(fieldNames).toContain("cpf");
  expect(fieldNames.some((n) => n.startsWith("nome"))).toBe(true);
});
