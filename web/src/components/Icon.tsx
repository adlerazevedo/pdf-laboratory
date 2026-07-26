interface IconProps {
  kind: string;
  size?: number;
  className?: string;
}

/** Ícones vetoriais simples, sem dependências externas e sem emojis. */
export function Icon({ kind, size = 20, className }: IconProps) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
    "aria-hidden": true,
  };

  switch (kind) {
    case "merge":
      return (
        <svg {...common}>
          <path d="M7 4v7a5 5 0 0 0 5 5 5 5 0 0 0 5-5V4" />
          <path d="M12 16v4" />
        </svg>
      );
    case "split":
      return (
        <svg {...common}>
          <rect x="3" y="4" width="8" height="16" rx="1.5" />
          <rect x="13" y="4" width="8" height="16" rx="1.5" />
        </svg>
      );
    case "organize":
      return (
        <svg {...common}>
          <rect x="4" y="4" width="7" height="7" rx="1" />
          <rect x="13" y="4" width="7" height="7" rx="1" />
          <rect x="4" y="13" width="7" height="7" rx="1" />
          <rect x="13" y="13" width="7" height="7" rx="1" />
        </svg>
      );
    case "extract":
      return (
        <svg {...common}>
          <rect x="5" y="3" width="14" height="18" rx="1.5" />
          <path d="M9 12h6M9 16h6" />
        </svg>
      );
    case "image":
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="16" rx="1.5" />
          <circle cx="9" cy="10" r="1.8" />
          <path d="M21 16l-5.5-5.5L7 19" />
        </svg>
      );
    case "watermark":
      return (
        <svg {...common}>
          <rect x="4" y="3" width="16" height="18" rx="1.5" />
          <path d="M8 8l8 8M16 8l-8 8" />
        </svg>
      );
    case "numbers":
      return (
        <svg {...common}>
          <rect x="4" y="3" width="16" height="18" rx="1.5" />
          <path d="M9 17h6" />
        </svg>
      );
    case "info":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v5" />
          <circle cx="12" cy="8" r="0.3" fill="currentColor" />
        </svg>
      );
    case "ocr":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M7 8h4M7 12h10M7 16h7" />
        </svg>
      );
    case "compress":
      return (
        <svg {...common}>
          <path d="M8 4v4H4M16 4v4h4M8 20v-4H4M16 20v-4h4" />
        </svg>
      );
    case "signature":
      return (
        <svg {...common}>
          <path d="M4 18c3-6 4-9 6-9s2 4 4 4 3-4 6-4" />
          <path d="M4 21h16" />
        </svg>
      );
    case "convert":
      return (
        <svg {...common}>
          <path d="M4 7h13M13 3l4 4-4 4" />
          <path d="M20 17H7M11 13l-4 4 4 4" />
        </svg>
      );
    case "redact":
      return (
        <svg {...common}>
          <rect x="4" y="4" width="16" height="16" rx="1.5" />
          <rect x="7" y="10" width="10" height="4" fill="currentColor" stroke="none" />
        </svg>
      );
    case "repair":
      return (
        <svg {...common}>
          <path d="M14 7l3 3-8 8H6v-3z" />
          <path d="M13 4l7 7" />
        </svg>
      );
    case "search":
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="6.5" />
          <path d="M20 20l-4.5-4.5" />
        </svg>
      );
    case "close":
      return (
        <svg {...common}>
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      );
    case "menu":
      return (
        <svg {...common}>
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      );
    case "upload":
      return (
        <svg {...common}>
          <path d="M12 16V4M8 8l4-4 4 4" />
          <path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
        </svg>
      );
    case "sun":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="4.5" />
          <path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
        </svg>
      );
    case "moon":
      return (
        <svg {...common}>
          <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z" />
        </svg>
      );
    case "shield":
      return (
        <svg {...common}>
          <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      );
    case "trash":
      return (
        <svg {...common}>
          <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />
        </svg>
      );
    case "rotate":
      return (
        <svg {...common}>
          <path d="M3 12a9 9 0 1 1 3 6.7" />
          <path d="M3 21v-5h5" />
        </svg>
      );
    case "undo":
      return (
        <svg {...common}>
          <path d="M9 7L4 12l5 5" />
          <path d="M4 12h11a5 5 0 0 1 0 10h-1" />
        </svg>
      );
    case "redo":
      return (
        <svg {...common}>
          <path d="M15 7l5 5-5 5" />
          <path d="M20 12H9a5 5 0 0 0 0 10h1" />
        </svg>
      );
    case "duplicate":
      return (
        <svg {...common}>
          <rect x="8" y="8" width="12" height="12" rx="1.5" />
          <path d="M4 16V5a1 1 0 0 1 1-1h11" />
        </svg>
      );
    case "blank-page":
      return (
        <svg {...common}>
          <rect x="5" y="3" width="14" height="18" rx="1.5" strokeDasharray="3 3" />
        </svg>
      );
    case "bookmarks":
      return (
        <svg {...common}>
          <path d="M7 3h10a1 1 0 0 1 1 1v16l-6-4-6 4V4a1 1 0 0 1 1-1Z" />
        </svg>
      );
    case "compare":
      return (
        <svg {...common}>
          <rect x="3" y="4" width="8" height="16" rx="1.5" />
          <rect x="13" y="4" width="8" height="16" rx="1.5" />
          <path d="M11 12h2" />
        </svg>
      );
    case "inspect":
      return (
        <svg {...common}>
          <circle cx="10" cy="10" r="6" />
          <path d="M14.5 14.5 20 20" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <rect x="4" y="4" width="16" height="16" rx="2" />
        </svg>
      );
  }
}
