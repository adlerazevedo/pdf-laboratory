import { expect, test } from "@playwright/test";

test.describe("PWA e caminho-base (Fase 7)", () => {
  test("o manifest.webmanifest é servido, é JSON válido e aponta para o caminho-base correto", async ({ page, request }) => {
    await page.goto("/");
    const manifestHref = await page.locator('link[rel="manifest"]').getAttribute("href");
    expect(manifestHref).toBe("/pdf-laboratory/manifest.webmanifest");

    const response = await request.get(manifestHref!);
    expect(response.status()).toBe(200);
    const manifest = await response.json();
    expect(manifest.name).toBe("PDF Laboratory");
    expect(manifest.short_name).toBe("PDF Lab");
    expect(manifest.start_url).toBe("/pdf-laboratory/");
    expect(manifest.scope).toBe("/pdf-laboratory/");
    expect(manifest.display).toBe("standalone");
    expect(Array.isArray(manifest.icons)).toBe(true);
    expect(manifest.icons.length).toBeGreaterThan(0);
  });

  test("todos os ícones listados no manifest são de fato acessíveis (200), não só declarados", async ({ page, request }) => {
    await page.goto("/");
    const manifestHref = await page.locator('link[rel="manifest"]').getAttribute("href");
    const manifest = await (await request.get(manifestHref!)).json();
    for (const icon of manifest.icons as { src: string }[]) {
      const iconUrl = new URL(icon.src, "http://localhost:4173/pdf-laboratory/").href;
      const res = await request.get(iconUrl);
      expect(res.status(), `ícone ${icon.src} deveria carregar`).toBe(200);
    }
  });

  test("o service worker registra com o escopo correto do caminho-base e fica ativo", async ({ page }) => {
    await page.goto("/");
    // navigator.serviceWorker.ready só resolve quando existe um worker ATIVO
    // para o escopo desta página — mais confiável que checar getRegistration()
    // logo após o load, já que a ativação leva um instante.
    const registration = await page.evaluate(async () => {
      if (!("serviceWorker" in navigator)) return null;
      const reg = await navigator.serviceWorker.ready;
      return { scope: reg.scope, active: !!reg.active };
    });
    expect(registration).not.toBeNull();
    expect(registration?.scope).toBe("http://localhost:4173/pdf-laboratory/");
    expect(registration?.active).toBe(true);
  });

  test("o cache do service worker nunca inclui PDFs do usuário, só os arquivos do próprio app", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(1000); // dá tempo do precache do Workbox terminar
    const cacheEntries = await page.evaluate(async () => {
      const names = await caches.keys();
      const all: string[] = [];
      for (const name of names) {
        const cache = await caches.open(name);
        const requests = await cache.keys();
        all.push(...requests.map((r) => r.url));
      }
      return all;
    });
    // Nenhuma entrada deve parecer um blob/arquivo de usuário — só assets do próprio build.
    for (const url of cacheEntries) {
      expect(url).not.toMatch(/\.pdf($|\?)/i);
      expect(url).toMatch(/\/pdf-laboratory\//);
    }
  });

  test("nenhum recurso da página inicial retorna 404 sob o caminho-base /pdf-laboratory/", async ({ page }) => {
    const failed: string[] = [];
    page.on("response", (response) => {
      const status = response.status();
      if (status >= 400) failed.push(`${status} ${response.url()}`);
    });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    expect(failed).toEqual([]);
  });

  test("navegar direto para /pdf-laboratory/ (sem passar por /) carrega o app normalmente", async ({ page }) => {
    await page.goto("/pdf-laboratory/");
    await expect(page.getByText("O que você deseja fazer?")).toBeVisible();
  });
});
