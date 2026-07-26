import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("carrega a tela inicial com identidade e aviso de privacidade", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("O que você deseja fazer?")).toBeVisible();
  await expect(page.getByText("Processamento local no navegador")).toBeVisible();
});

test("busca filtra as ferramentas", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Buscar ferramentas").fill("marca d");
  await expect(page.getByText("Marca d'água")).toBeVisible();
  await expect(page.getByText("Unir PDFs")).toHaveCount(0);
});

test("ferramentas exclusivas do desktop aparecem desabilitadas, nunca como botão falso ativo", async ({ page }) => {
  await page.goto("/");
  const button = page.getByRole("button", { name: "Otimização avançada (Ghostscript)" });
  await expect(button).toBeDisabled();
});

test("não há violações críticas de acessibilidade na tela inicial", async ({ page }) => {
  await page.goto("/");
  const results = await new AxeBuilder({ page }).analyze();
  const critical = results.violations.filter((v) => v.impact === "critical");
  expect(critical).toEqual([]);
});

test("tema escuro pode ser alternado e persiste no recarregamento", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Alternar tema" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});
