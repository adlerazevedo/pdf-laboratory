import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("link 'Web × Desktop' na barra lateral abre a página explicativa", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Web × Desktop: qual usar?" }).click();
  await expect(page.getByRole("heading", { name: "Web × Desktop: qual devo usar?" })).toBeVisible();
});

test("página explica a distinção entre limitação permanente e ferramenta ainda não portada", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Web × Desktop: qual usar?" }).click();
  await expect(page.getByText("Limitação permanente (dependem de binário nativo ou certificado):")).toBeVisible();
  await expect(page.getByText("Ainda não portadas para o navegador (podem vir a existir no futuro):")).toBeVisible();
  await expect(page.getByText("Marcadores (bookmarks)").first()).toBeVisible();
  await expect(page.getByText("Comparação de documentos").first()).toBeVisible();
  await expect(page.getByText("Inspeção técnica do PDF").first()).toBeVisible();
});

test("página mostra o comando de instalação real e a ressalva sobre instalador e repositório privado", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Web × Desktop: qual usar?" }).click();
  await expect(page.getByText("python PDF_Laboratory.py", { exact: false })).toBeVisible();
  await expect(page.getByText("Duas ressalvas honestas antes de você procurar o desktop")).toBeVisible();
});

test("os três novos itens desktop-only aparecem desabilitados na barra lateral, nunca como botão falso ativo", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Marcadores (bookmarks)", exact: true }).first()).toBeDisabled();
  await expect(page.getByRole("button", { name: "Comparação de documentos", exact: true }).first()).toBeDisabled();
  await expect(page.getByRole("button", { name: "Inspeção técnica do PDF", exact: true }).first()).toBeDisabled();
});

test("não há violações críticas de acessibilidade na página Web × Desktop", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Web × Desktop: qual usar?" }).click();
  const results = await new AxeBuilder({ page }).analyze();
  const critical = results.violations.filter((v) => v.impact === "critical");
  expect(critical).toEqual([]);
});
