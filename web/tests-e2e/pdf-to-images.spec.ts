import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { join } from "node:path";

const FIXTURE = join(import.meta.dirname, "../../shared/test-fixtures/generated/sintetico-3-paginas.pdf");

test("PDF em imagens: exporta páginas selecionadas em PNG e baixa tudo em .zip", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "PDF em imagens" }).first().click();
  await page.setInputFiles('input[type="file"]', FIXTURE);

  await expect(page.getByText("3 páginas")).toBeVisible({ timeout: 15_000 });
  await page.getByLabel(/Páginas a exportar/).fill("1-3");
  await page.locator("select").nth(0).selectOption("png");

  await page.getByRole("button", { name: "Gerar imagens" }).click();
  await expect(page.getByText("imagens geradas")).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('img[alt$=".png"]')).toHaveCount(3);

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: /Baixar tudo/ }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/-imagens\.zip$/);
});

test("PDF em imagens: exportar apenas a página 2 gera uma única imagem", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "PDF em imagens" }).first().click();
  await page.setInputFiles('input[type="file"]', FIXTURE);
  await expect(page.getByText("3 páginas")).toBeVisible({ timeout: 15_000 });
  await page.getByLabel(/Páginas a exportar/).fill("2");
  await page.getByRole("button", { name: "Gerar imagens" }).click();
  await expect(page.getByText("1 imagem gerada")).toBeVisible({ timeout: 15_000 });
});

test("PDF em imagens: intervalo de páginas inválido mostra erro claro", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "PDF em imagens" }).first().click();
  await page.setInputFiles('input[type="file"]', FIXTURE);
  await expect(page.getByText("3 páginas")).toBeVisible({ timeout: 15_000 });
  await page.getByLabel(/Páginas a exportar/).fill("99");
  await page.getByRole("button", { name: "Gerar imagens" }).click();
  await expect(page.getByRole("alert")).toBeVisible();
});

test("PDF em imagens: sem violações críticas de acessibilidade", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "PDF em imagens" }).first().click();
  await page.setInputFiles('input[type="file"]', FIXTURE);
  await expect(page.getByText("3 páginas")).toBeVisible({ timeout: 15_000 });
  const results = await new AxeBuilder({ page }).analyze();
  const critical = results.violations.filter((v) => v.impact === "critical");
  expect(critical).toEqual([]);
});
