import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { join } from "node:path";

const FIXTURE_10 = join(import.meta.dirname, "../../shared/test-fixtures/generated/sintetico-10-paginas.pdf");

async function openSplitWithFixture(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Dividir PDF", exact: true }).click();
  await page.setInputFiles('input[type="file"]', FIXTURE_10);
  await expect(page.getByText("10 páginas")).toBeVisible({ timeout: 15_000 });
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
