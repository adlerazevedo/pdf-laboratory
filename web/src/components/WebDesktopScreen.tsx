import { ScreenHeader } from "./tools/ScreenHeader";
import { InlineAlert } from "./InlineAlert";

const DESKTOP_INSTALL_COMMAND = `cd desktop
pip install PySide6 pypdf pypdfium2 Pillow pydantic platformdirs psutil
python PDF_Laboratory.py`;

const DESKTOP_CHECKSUM = "32fb44e966f56975c0e970fb52cbb9123290fcbf57464b80c59cd7bdfd6f7a53";

const NATIVE_BINARY_TOOLS: { title: string; reason: string }[] = [
  { title: "Otimização avançada", reason: "usa o Ghostscript, um binário nativo que não pode ser distribuído nem executado dentro de um navegador." },
  { title: "Converter Office (Word/Excel/PowerPoint)", reason: "usa o LibreOffice em modo linha de comando (subprocesso), também um binário nativo." },
  { title: "Assinatura digital (ICP-Brasil)", reason: "exige carregar um certificado A1/A3 (arquivo .pfx/.p12 ou token) — material sensível que nunca deve trafegar por código de terceiros dentro de um navegador." },
  { title: "Redação segura", reason: "depende do mesmo pipeline nativo de rasterização usado na otimização avançada, para garantir que o conteúdo apagado não sobrevive em nenhuma camada do arquivo." },
  { title: "Reparo avançado", reason: "usa o qpdf, outro binário nativo, para reconstruir arquivos corrompidos em nível estrutural." },
];

const NOT_YET_PORTED_TOOLS: { title: string; reason: string }[] = [
  { title: "Marcadores (bookmarks)", reason: "ainda não tem um motor equivalente construído para o navegador — não é uma limitação permanente, apenas trabalho ainda não feito." },
  { title: "Comparação de documentos", reason: "a comparação página a página de alta fidelidade ainda não tem motor equivalente no navegador." },
  { title: "Inspeção técnica do PDF", reason: "a inspeção profunda da estrutura interna do arquivo ainda não tem motor equivalente no navegador." },
];

/**
 * Página explicativa Web × Desktop (Fase 5). Não é uma ferramenta de PDF —
 * é conteúdo informativo, acessível pela barra lateral, explicando por que
 * algumas ferramentas só existem no aplicativo desktop e como obtê-lo.
 */
export function WebDesktopScreen() {
  return (
    <div style={{ maxWidth: 720 }}>
      <ScreenHeader
        title="Web × Desktop: qual devo usar?"
        description="As duas versões processam seus arquivos inteiramente no seu computador — nenhuma envia documentos para um servidor. A diferença está no que cada uma consegue fazer e no que cada uma exige de você."
      />

      <section style={{ marginBottom: "var(--space-6)" }}>
        <h2 style={{ fontSize: 15, margin: "0 0 var(--space-2)" }}>Versão web (esta que você está usando)</h2>
        <p className="text-muted" style={{ margin: 0 }}>
          Não exige instalação — funciona assim que a página carrega, e pode ser instalada como aplicativo (PWA) direto do navegador.
          Cobre a maior parte das ferramentas de manipulação de PDF. Um pequeno grupo de ferramentas permanece exclusivo do desktop,
          pelos motivos explicados abaixo — nenhuma delas aparece como botão ativo aqui; todas mostram claramente
          "Disponível no aplicativo desktop".
        </p>
      </section>

      <section style={{ marginBottom: "var(--space-6)" }}>
        <h2 style={{ fontSize: 15, margin: "0 0 var(--space-2)" }}>Versão desktop</h2>
        <p className="text-muted" style={{ margin: 0 }}>
          Aplicativo Python (PySide6) que roda no seu computador. Tem o conjunto completo de ferramentas, incluindo as que dependem
          de binários nativos ou de certificados digitais. Em troca, exige instalar Python e algumas dependências — não existe hoje
          um instalador empacotado (.exe/.dmg/.AppImage) pronto para baixar.
        </p>
      </section>

      <section style={{ marginBottom: "var(--space-6)" }}>
        <h2 style={{ fontSize: 15, margin: "0 0 var(--space-3)" }}>Por que essas ferramentas só existem no desktop</h2>
        <p className="text-muted" style={{ margin: "0 0 var(--space-3)" }}>
          Duas razões diferentes — vale a pena distingui-las:
        </p>
        <p style={{ fontWeight: 600, margin: "0 0 4px" }}>Limitação permanente (dependem de binário nativo ou certificado):</p>
        <ul style={{ margin: "0 0 var(--space-3)", paddingLeft: 20 }}>
          {NATIVE_BINARY_TOOLS.map((t) => (
            <li key={t.title} style={{ marginBottom: 4 }}>
              <strong>{t.title}</strong> — {t.reason}
            </li>
          ))}
        </ul>
        <p style={{ fontWeight: 600, margin: "0 0 4px" }}>Ainda não portadas para o navegador (podem vir a existir no futuro):</p>
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          {NOT_YET_PORTED_TOOLS.map((t) => (
            <li key={t.title} style={{ marginBottom: 4 }}>
              <strong>{t.title}</strong> — {t.reason}
            </li>
          ))}
        </ul>
      </section>

      <section style={{ marginBottom: "var(--space-6)" }}>
        <h2 style={{ fontSize: 15, margin: "0 0 var(--space-2)" }}>Como obter e rodar o desktop</h2>
        <p className="text-muted" style={{ margin: "0 0 var(--space-3)" }}>
          Requer Python 3 instalado. A partir do código-fonte do projeto:
        </p>
        <pre
          style={{
            background: "var(--surface-2)",
            borderRadius: "var(--radius-md)",
            padding: "var(--space-3) var(--space-4)",
            fontSize: 13,
            overflowX: "auto",
            margin: "0 0 var(--space-3)",
          }}
        >
{DESKTOP_INSTALL_COMMAND}
        </pre>
        <p className="text-muted" style={{ margin: "0 0 var(--space-2)", fontSize: 13 }}>
          Checksum de <code>desktop/PDF_Laboratory.py</code> (v1.7.0), para conferir a integridade do arquivo que você baixou:
        </p>
        <pre
          style={{
            background: "var(--surface-2)",
            borderRadius: "var(--radius-md)",
            padding: "var(--space-2) var(--space-4)",
            fontSize: 12,
            overflowX: "auto",
            margin: 0,
          }}
        >
sha256: {DESKTOP_CHECKSUM}
        </pre>
      </section>

      <InlineAlert
        level="warning"
        title="Duas ressalvas honestas antes de você procurar o desktop"
        message="Ainda não existe um instalador pronto (.exe/.dmg/.AppImage) — a única forma de rodar o desktop hoje é clonar o código-fonte e executá-lo com Python, conforme os comandos acima."
        details={
          "Além disso, o repositório de código-fonte deste projeto está, no momento em que esta página foi escrita, marcado como privado no GitHub. " +
          "Se você chegou até este aplicativo web mas não tem acesso ao repositório, peça ao responsável pelo projeto para liberar seu acesso antes de tentar clonar o código. " +
          "Esta ressalva existe para não prometer um caminho que, para você, pode não estar disponível ainda."
        }
      />
    </div>
  );
}
