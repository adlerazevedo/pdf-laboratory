import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// PNG 1x1 e JPEG 4x4 sintéticos, gerados uma vez por execução — nunca imagens reais.
const TINY_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);
const TINY_JPEG = Buffer.from(
  "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAEAAQDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDlKKKK8g/RT//Z",
  "base64",
);

function writeTinyImages(): { png: string; jpg: string } {
  const dir = mkdtempSync(join(tmpdir(), "pdflab-img-"));
  const png = join(dir, "teste.png");
  const jpg = join(dir, "teste.jpg");
  writeFileSync(png, TINY_PNG);
  writeFileSync(jpg, TINY_JPEG);
  return { png, jpg };
}

test("imagens em PDF: várias imagens, layout A4 paisagem preenchendo a página, gera e baixa", async ({ page }) => {
  const { png, jpg } = writeTinyImages();
  await page.goto("/");
  await page.getByRole("button", { name: "Imagens em PDF" }).first().click();
  await page.setInputFiles('input[type="file"]', [png, jpg]);

  await expect(page.getByText("2 imagens")).toBeVisible({ timeout: 15_000 });

  const selects = page.locator("select");
  await selects.nth(0).selectOption("a4");
  await selects.nth(1).selectOption("landscape");
  await selects.nth(2).selectOption("fill");

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Gerar PDF" }).click().then(async () => {
      await expect(page.getByText("Concluído")).toBeVisible({ timeout: 15_000 });
      await page.getByRole("button", { name: "Baixar" }).click();
    }),
  ]);
  expect(download.suggestedFilename()).toBe("imagens-para-pdf.pdf");
});

test("imagens em PDF: remover uma imagem antes de gerar reduz a contagem", async ({ page }) => {
  const { png, jpg } = writeTinyImages();
  await page.goto("/");
  await page.getByRole("button", { name: "Imagens em PDF" }).first().click();
  await page.setInputFiles('input[type="file"]', [png, jpg]);
  await expect(page.getByText("2 imagens")).toBeVisible({ timeout: 15_000 });
  await page.getByRole("button", { name: "Remover imagem 1" }).click();
  await expect(page.getByText("1 imagem")).toBeVisible();
});

test("imagens em PDF: sem violações críticas de acessibilidade", async ({ page }) => {
  const { png } = writeTinyImages();
  await page.goto("/");
  await page.getByRole("button", { name: "Imagens em PDF" }).first().click();
  await page.setInputFiles('input[type="file"]', [png]);
  await expect(page.getByText("1 imagem")).toBeVisible({ timeout: 15_000 });
  const results = await new AxeBuilder({ page }).analyze();
  const critical = results.violations.filter((v) => v.impact === "critical");
  expect(critical).toEqual([]);
});
