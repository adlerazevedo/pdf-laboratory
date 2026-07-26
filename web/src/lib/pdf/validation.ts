/**
 * Validação de arquivos como entrada NÃO CONFIÁVEL. Nunca confiamos apenas
 * na extensão ".pdf" — verificamos a assinatura mágica real do arquivo
 * (%PDF-) e só então tentamos abri-lo com o parser (pdf.js), que também
 * trata o conteúdo como não confiável.
 */

export const MAX_FILE_SIZE_BYTES = 200 * 1024 * 1024; // 200 MB — limite configurável, evita travar a aba com arquivos absurdos.

export interface ValidationResult {
  valid: boolean;
  reason?: string;
}

const PDF_MAGIC_BYTES = [0x25, 0x50, 0x44, 0x46, 0x2d]; // "%PDF-"

export async function validatePdfFile(file: File): Promise<ValidationResult> {
  if (file.size === 0) {
    return { valid: false, reason: "O arquivo está vazio." };
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      reason: `Arquivo maior que o limite de ${(MAX_FILE_SIZE_BYTES / (1024 * 1024)).toFixed(0)} MB para esta versão web.`,
    };
  }
  const head = new Uint8Array(await file.slice(0, 5).arrayBuffer());
  const looksLikePdf = PDF_MAGIC_BYTES.every((byte, i) => head[i] === byte);
  if (!looksLikePdf) {
    return {
      valid: false,
      reason: "O arquivo não começa com a assinatura mágica de um PDF (%PDF-). Pode estar corrompido ou não ser um PDF de verdade.",
    };
  }
  return { valid: true };
}

export function validateImageFile(file: File): ValidationResult {
  const okTypes = ["image/png", "image/jpeg"];
  if (!okTypes.includes(file.type)) {
    return { valid: false, reason: "Formato de imagem não suportado (use PNG ou JPEG)." };
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { valid: false, reason: "Imagem maior que o limite permitido." };
  }
  return { valid: true };
}
