import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// Nome real do repositório no GitHub. É usado como sub-caminho do GitHub
// Pages (https://<usuario>.github.io/<repo>/). Se o repositório publicado
// tiver outro nome (ver README raiz), atualize esta constante antes do
// deploy — o workflow de deploy NÃO sobrescreve isto automaticamente.
const REPO_NAME = "pdf-laboratory";

// Em desenvolvimento local (`npm run dev` / `vite preview`) usamos "/" para
// não exigir o sub-caminho. Em build de produção (o que os workflows do
// GitHub Actions executam) usamos "/<REPO_NAME>/", que é o caminho real do
// GitHub Pages para um repositório de projeto (não é o Pages de usuário).
const isProdBuild = process.env.NODE_ENV === "production" || process.env.CI === "true";

export default defineConfig({
  base: isProdBuild ? `/${REPO_NAME}/` : "/",
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt", // nunca atualiza silenciosamente sem avisar o usuário
      includeAssets: ["favicon.svg"],
      manifest: {
        name: "PDF Laboratory",
        short_name: "PDF Lab",
        description:
          "Suíte local e privada para manipulação de PDFs, executada inteiramente no navegador.",
        theme_color: "#147D82",
        background_color: "#F5F7FA",
        display: "standalone",
        start_url: isProdBuild ? `/${REPO_NAME}/` : "/",
        scope: isProdBuild ? `/${REPO_NAME}/` : "/",
        icons: [
          { src: "pwa-192.svg", sizes: "192x192", type: "image/svg+xml" },
          { src: "pwa-512.svg", sizes: "512x512", type: "image/svg+xml" },
        ],
      },
      workbox: {
        // Cacheia somente os recursos estáticos do build (JS/CSS/HTML/ícones).
        // NUNCA cacheia PDFs do usuário — nenhum documento passa pelo
        // service worker, então não há risco de um PDF ficar preso em cache.
        globPatterns: ["**/*.{js,mjs,css,html,svg,woff2}"],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  worker: {
    format: "es",
  },
  build: {
    target: "es2022",
    sourcemap: true,
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    css: true,
    exclude: ["**/node_modules/**", "**/dist/**", "tests-e2e/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
    },
  },
});
