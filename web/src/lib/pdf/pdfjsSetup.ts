import * as pdfjsLib from "pdfjs-dist";
// Bundlado pelo Vite (sem CDN em produção) — garante funcionamento offline/PWA
// e integridade do worker.
import PdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = PdfWorker;

export { pdfjsLib };
