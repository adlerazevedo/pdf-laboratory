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
