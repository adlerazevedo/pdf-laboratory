import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { join } from "node:path";

const FIXTURE = join(import.meta.dirname, "../../shared/test-fixtures/generated/sintetico-3-paginas.pdf");

test("organizar páginas: miniaturas, rotação, duplicação, exclusão, página em branco, desfazer e salvar", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Organizar páginas" }).click();
  await page.setInputFiles('input[type="file"]', FIXTURE);

  await expect(page.getByRole("button", { name: "Selecionar todas" })).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('[role="checkbox"]')).toHaveCount(3);

  await page.getByRole("button", { name: "Girar página 1" }).click();
  await page.getByRole("button", { name: "Duplicar página 2" }).click();
  await expect(page.locator('[role="checkbox"]')).toHaveCount(4);

  await page.getByRole("button", { name: "Inserir página em branco" }).click();
  await expect(page.locator('[role="checkbox"]')).toHaveCount(5);

  await page.getByRole("button", { name: "Excluir página 1" }).click();
  await expect(page.locator('[role="checkbox"]')).toHaveCount(4);

  await page.getByRole("button", { name: "Desfazer" }).click();
  await expect(page.locator('[role="checkbox"]')).toHaveCount(5);

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Salvar como novo PDF" }).click().then(async () => {
      await expect(page.getByText("Concluído")).toBeVisible({ timeout: 15_000 });
      await page.getByRole("button", { name: "Baixar" }).click();
    }),
  ]);
  expect(download.suggestedFilename()).toMatch(/organizado\.pdf$/);
});

test("organizar páginas: bloqueia salvar quando todas as páginas são excluídas", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Organizar páginas" }).click();
  await page.setInputFiles('input[type="file"]', FIXTURE.replace("3-paginas", "1-pagina"));
  await expect(page.getByRole("button", { name: "Selecionar todas" })).toBeVisible({ timeout: 15_000 });
  await page.getByRole("button", { name: "Excluir página 1" }).click();
  await page.getByRole("button", { name: "Salvar como novo PDF" }).click();
  await expect(page.getByText(/não é possível salvar um pdf sem nenhuma página/i)).toBeVisible();
});

test("organizar páginas: sem violações críticas de acessibilidade", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Organizar páginas" }).click();
  await page.setInputFiles('input[type="file"]', FIXTURE);
  await expect(page.getByRole("button", { name: "Selecionar todas" })).toBeVisible({ timeout: 15_000 });
  const results = await new AxeBuilder({ page }).analyze();
  const critical = results.violations.filter((v) => v.impact === "critical");
  expect(critical).toEqual([]);
});
