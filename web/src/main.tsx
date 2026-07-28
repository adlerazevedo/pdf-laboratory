import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App";
import "./styles/global.css";

// registerType: "prompt" (vite.config.ts) — nunca atualiza silenciosamente;
// aqui decidimos o que fazer quando uma nova versão está pronta.
//
// IMPORTANTE: registerSW() devolve uma função updateSW(reloadPage?) que
// ativa o novo service worker (posta SKIP_WAITING nele e assume o controle
// da página) e só então recarrega. Chamar apenas window.location.reload()
// aqui SEM invocar updateSW() recarrega a página ainda sob o controle do
// service worker ANTIGO (que continua "waiting"), então o usuário via o
// mesmo conteúdo desatualizado de novo — o novo worker nunca era ativado.
const updateSW = registerSW({
  onNeedRefresh() {
    // eslint-disable-next-line no-alert
    const shouldReload = window.confirm("Uma nova versão do PDF Laboratory está disponível. Atualizar agora?");
    if (shouldReload) void updateSW(true);
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
