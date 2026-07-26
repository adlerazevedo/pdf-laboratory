import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { join } from "node:path";

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
