interface ResultCardProps {
  fileName: string;
  sizeBytes: number;
  onDownload: () => void;
  onRunAgain: () => void;
  note?: string;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function ResultCard({ fileName, sizeBytes, onDownload, onRunAgain, note }: ResultCardProps) {
  return (
    <div id="ResultCard" className="card" style={{ padding: "var(--space-4)" }}>
      <p style={{ margin: 0, fontWeight: 600, color: "var(--success)" }}>Concluído</p>
      <p style={{ margin: "4px 0 0" }}>{fileName}</p>
      <p className="text-muted" style={{ margin: "2px 0 0", fontSize: 13 }}>{formatSize(sizeBytes)}</p>
      {note && <p className="text-muted" style={{ fontSize: 12 }}>{note}</p>}
      <div style={{ display: "flex", gap: "var(--space-2)", marginTop: "var(--space-3)" }}>
        <button type="button" className="btn btn-primary" onClick={onDownload}>Baixar</button>
        <button type="button" className="btn" onClick={onRunAgain}>Executar novamente</button>
      </div>
    </div>
  );
}
