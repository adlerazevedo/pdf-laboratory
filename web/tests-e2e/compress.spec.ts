import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// JPEG sintético 4x4, reaproveitado dos outros specs — nunca dados reais.
const TINY_JPEG_B64 =
  "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAEAAQDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDlKKKK8g/RT//Z";

async function writeFixture(): Promise<string> {
  const jpegBytes = Buffer.from(TINY_JPEG_B64, "base64");
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const img = await doc.embedJpg(jpegBytes);
  const page = doc.addPage([200, 200]);
  page.drawImage(img, { x: 0, y: 0, width: 200, height: 200 });
  page.drawText("texto real, nao deve ser afetado", { x: 5, y: 180, size: 8, font });
  const bytes = await doc.save();
  const dir = mkdtempSync(join(tmpdir(), "pdflab-compress-"));
  const path = join(dir, "compress-source.pdf");
  writeFileSync(path, bytes);
  return path;
}

test("compressão básica: comprime um PDF com imagem JPEG e baixa o resultado", async ({ page }) => {
  const fixture = await writeFixture();
  await page.goto("/");
  await page.getByRole("button", { name: "Compressão básica", exact: true }).first().click();
  await page.setInputFiles('input[type="file"]', fixture);
  await expect(page.getByText("compress-source.pdf")).toBeVisible({ timeout: 15_000 });

  await page.getByText("Forte", { exact: true }).click();

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Comprimir", exact: true }).click().then(async () => {
      await expect(page.getByText("Concluído")).toBeVisible({ timeout: 20_000 });
      await page.getByRole("button", { name: "Baixar", exact: true }).click();
    }),
  ]);
  expect(download.suggestedFilename()).toMatch(/-comprimido\.pdf$/);
});

test("compressão básica: PDF sem imagens não quebra, mostra aviso de que não houve redução", async ({ page }) => {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const p = doc.addPage([200, 200]);
  p.drawText("apenas texto, sem imagens", { x: 10, y: 100, size: 12, font });
  const bytes = await doc.save();
  const dir = mkdtempSync(join(tmpdir(), "pdflab-compress-noimg-"));
  const path = join(dir, "sem-imagens.pdf");
  writeFileSync(path, bytes);

  await page.goto("/");
  await page.getByRole("button", { name: "Compressão básica", exact: true }).first().click();
  await page.setInputFiles('input[type="file"]', path);
  await expect(page.getByText("sem-imagens.pdf")).toBeVisible({ timeout: 15_000 });
  await page.getByRole("button", { name: "Comprimir", exact: true }).click();
  await expect(page.getByText("Concluído")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText("Nenhuma imagem JPEG recomprimível foi encontrada")).toBeVisible();
  await expect(page.getByText("Este documento não encolheu")).toBeVisible();
});

test("compressão básica: sem violações críticas de acessibilidade", async ({ page }) => {
  const fixture = await writeFixture();
  await page.goto("/");
  await page.getByRole("button", { name: "Compressão básica", exact: true }).first().click();
  await page.setInputFiles('input[type="file"]', fixture);
  await expect(page.getByText("compress-source.pdf")).toBeVisible({ timeout: 15_000 });
  const results = await new AxeBuilder({ page }).analyze();
  const critical = results.violations.filter((v) => v.impact === "critical");
  expect(critical).toEqual([]);
});
