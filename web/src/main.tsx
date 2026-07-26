import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App";
import "./styles/global.css";

// registerType: "prompt" (vite.config.ts) — nunca atualiza silenciosamente;
// aqui decidimos o que fazer quando uma nova versão está pronta.
registerSW({
  onNeedRefresh() {
    // eslint-disable-next-line no-alert
    const shouldReload = window.confirm("Uma nova versão do PDF Laboratory está disponível. Atualizar agora?");
    if (shouldReload) window.location.reload();
  },
  onOfflineReady() {
    console.info("PDF Laboratory está pronto para uso offline.");
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
