import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("layout responsivo (Fase 6)", () => {
  test("em tela larga a barra lateral fica sempre visível, sem botão de menu", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    await expect(page.getByRole("button", { name: "Abrir menu" })).toBeHidden();
    await expect(page.locator("#Sidebar")).toBeVisible();
    await expect(page.getByRole("button", { name: "Unir PDFs", exact: true }).first()).toBeVisible();
  });

  test("em tela estreita a barra lateral vira uma gaveta fechada por padrão", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 700 });
    await page.goto("/");
    await expect(page.getByRole("button", { name: "Abrir menu" })).toBeVisible();
    // A gaveta existe no DOM mas fica fora da tela (visibility:hidden) até abrir.
    await expect(page.locator("#Sidebar")).toBeHidden();
  });

  test("abrir e fechar a gaveta pelo botão de menu", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 700 });
    await page.goto("/");
    await page.getByRole("button", { name: "Abrir menu" }).click();
    await expect(page.locator("#Sidebar")).toBeVisible();
    await expect(page.getByRole("button", { name: "Fechar menu" }).first()).toBeVisible();
    await page.getByRole("button", { name: "Fechar menu" }).first().click();
    await expect(page.locator("#Sidebar")).toBeHidden();
  });

  test("clicar no fundo escurecido (backdrop) fecha a gaveta", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 700 });
    await page.goto("/");
    await page.getByRole("button", { name: "Abrir menu" }).click();
    await expect(page.locator("#Sidebar")).toBeVisible();
    // O backdrop cobre a largura toda, mas a gaveta (280px, z-index maior)
    // fica por cima da metade esquerda dele — clicar no ponto padrão (centro
    // da bounding box do backdrop) cairia sobre a própria gaveta. Clicamos
    // deliberadamente numa coordenada fora da gaveta, na faixa exposta do
    // backdrop (achado real ao rodar este teste: sem isso, o clique padrão
    // do Playwright trava esperando o elemento ficar "clicável").
    await page.getByRole("button", { name: "Fechar menu" }).nth(1).click({ position: { x: 350, y: 300 } });
    await expect(page.locator("#Sidebar")).toBeHidden();
  });

  test("tecla Escape fecha a gaveta", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 700 });
    await page.goto("/");
    await page.getByRole("button", { name: "Abrir menu" }).click();
    await expect(page.locator("#Sidebar")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator("#Sidebar")).toBeHidden();
  });

  test("selecionar uma ferramenta pela gaveta fecha o menu automaticamente", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 700 });
    await page.goto("/");
    await page.getByRole("button", { name: "Abrir menu" }).click();
    await page.getByRole("button", { name: "Unir PDFs", exact: true }).first().click();
    await expect(page.locator("#Sidebar")).toBeHidden();
    await expect(page.getByRole("heading", { name: "Unir PDFs" })).toBeVisible();
  });

  test("cabeçalho não estoura em 375px: nenhum elemento fora da largura da viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 700 });
    await page.goto("/");
    const header = page.locator("#AppHeader");
    const box = await header.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeLessThanOrEqual(375);
    // O botão de alternar tema precisa estar inteiramente visível (não cortado).
    const themeButton = page.getByRole("button", { name: "Alternar tema" });
    const themeBox = await themeButton.boundingBox();
    expect(themeBox).not.toBeNull();
    expect(themeBox!.x + themeBox!.width).toBeLessThanOrEqual(375);
  });

  test("sem violações críticas/sérias de acessibilidade com a gaveta aberta em mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 700 });
    await page.goto("/");
    await page.getByRole("button", { name: "Abrir menu" }).click();
    const results = await new AxeBuilder({ page }).analyze();
    const relevant = results.violations.filter((v) => v.impact === "critical" || v.impact === "serious");
    expect(relevant).toEqual([]);
  });
});
