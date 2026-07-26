import { useCallback, useRef, useState } from "react";
import { Icon } from "./Icon";
import { validatePdfFile, type ValidationResult } from "../lib/pdf/validation";
import { markSessionActive } from "../lib/sessionActivity";

type DropState = "empty" | "dragging" | "accepted" | "rejected";

interface DropZoneProps {
  onFilesAccepted: (files: File[]) => void;
  multiple?: boolean;
  accept?: string;
  hint?: string;
  /**
   * Validador customizado (ex.: validateImageFile). Quando ausente e
   * accept === ".pdf", usa a validação de assinatura mágica de PDF.
   * Quando ausente e accept for outra coisa, nenhuma validação é aplicada
   * além do próprio atributo "accept" do input de arquivo.
   */
  validate?: (file: File) => ValidationResult | Promise<ValidationResult>;
}

export function DropZone({ onFilesAccepted, multiple = false, accept = ".pdf", hint, validate }: DropZoneProps) {
  const [state, setState] = useState<DropState>("empty");
  const [message, setMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateAndAccept = useCallback(
    async (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;
      const files = Array.from(fileList);
      const validator = validate ?? (accept === ".pdf" ? validatePdfFile : undefined);
      if (validator) {
        for (const file of files) {
          const result = await validator(file);
          if (!result.valid) {
            setState("rejected");
            setMessage(result.reason ?? "Arquivo inválido.");
            return;
          }
        }
      }
      setState("accepted");
      setMessage(null);
      markSessionActive();
      onFilesAccepted(files);
    },
    [accept, onFilesAccepted, validate],
  );

  return (
    <div
      id="DropArea"
      data-state={state}
      role="button"
      tabIndex={0}
      aria-label="Área para soltar ou selecionar arquivos"
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setState("dragging");
      }}
      onDragLeave={() => setState((s) => (s === "dragging" ? "empty" : s))}
      onDrop={(e) => {
        e.preventDefault();
        void validateAndAccept(e.dataTransfer.files);
      }}
      style={{
        border: `2px dashed ${state === "rejected" ? "var(--danger)" : state === "accepted" ? "var(--success)" : "var(--border)"}`,
        borderRadius: "var(--radius-lg)",
        padding: "var(--space-6)",
        textAlign: "center",
        cursor: "pointer",
        background: state === "dragging" ? "var(--surface-2)" : "var(--surface)",
        transition: "background-color 120ms ease, border-color 120ms ease",
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="visually-hidden"
        aria-label="Selecionar arquivos do seu computador"
        onChange={(e) => void validateAndAccept(e.target.files)}
      />
      <Icon kind="upload" size={32} className="text-muted" />
      <p style={{ margin: "var(--space-3) 0 var(--space-1)", fontWeight: 600 }}>
        {state === "rejected" ? "Arquivo não aceito" : state === "accepted" ? "Arquivo pronto" : "Arraste seus arquivos aqui"}
      </p>
      <p className="text-muted" style={{ margin: 0, fontSize: 13 }}>
        {message ?? hint ?? "ou clique para selecionar do seu computador"}
      </p>
      <button type="button" className="btn btn-primary" style={{ marginTop: "var(--space-4)" }}>
        Selecionar arquivos
      </button>
    </div>
  );
}
