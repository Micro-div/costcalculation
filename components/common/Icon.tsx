import type { IconName } from "@/types";

export function Icon({
  name,
  className = "h-5 w-5",
}: {
  name: IconName;
  className?: string;
}) {
  const props = {
    className,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  switch (name) {
    case "arrow-right":
      return (
        <svg {...props}>
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      );
    case "bot":
      return (
        <svg {...props}>
          <rect x="3" y="7" width="18" height="13" rx="3" />
          <path d="M8 3h8M12 3v4M8 13h.01M16 13h.01M8 17h8" />
        </svg>
      );
    case "calculator":
      return (
        <svg {...props}>
          <rect x="4" y="2" width="16" height="20" rx="3" />
          <path d="M8 6h8M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 19h.01M12 19h.01M16 19h.01" />
        </svg>
      );
    case "check":
      return (
        <svg {...props}>
          <path d="m5 12 4 4L19 6" />
        </svg>
      );
    case "chevron-down":
      return (
        <svg {...props}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      );
    case "clock":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      );
    case "close":
      return (
        <svg {...props}>
          <path d="m6 6 12 12M18 6 6 18" />
        </svg>
      );
    case "code":
      return (
        <svg {...props}>
          <path d="m8 9-4 3 4 3M16 9l4 3-4 3M14 5l-4 14" />
        </svg>
      );
    case "download":
      return (
        <svg {...props}>
          <path d="M12 3v12m0 0 4-4m-4 4-4-4M4 20h16" />
        </svg>
      );
    case "file-text":
      return (
        <svg {...props}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
          <path d="M14 2v6h6M8 13h8M8 17h6" />
        </svg>
      );
    case "globe":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
        </svg>
      );
    case "layers":
      return (
        <svg {...props}>
          <path d="m12 2 9 5-9 5-9-5 9-5Z" />
          <path d="m3 12 9 5 9-5M3 17l9 5 9-5" />
        </svg>
      );
    case "lock":
      return (
        <svg {...props}>
          <rect x="4" y="10" width="16" height="11" rx="2" />
          <path d="M8 10V7a4 4 0 0 1 8 0v3" />
        </svg>
      );
    case "megaphone":
      return (
        <svg {...props}>
          <path d="m3 11 15-6v14L3 13v-2ZM11 16l1 5H7l-2-7M19 9a3 3 0 0 1 0 6" />
        </svg>
      );
    case "menu":
      return (
        <svg {...props}>
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      );
    case "palette":
      return (
        <svg {...props}>
          <path d="M12 3a9 9 0 0 0 0 18h1.4a1.6 1.6 0 0 0 1.1-2.8 1.6 1.6 0 0 1 1.1-2.8H18A3 3 0 0 0 21 12a9 9 0 0 0-9-9Z" />
          <path d="M7.5 10h.01M9 6.5h.01M14 6.5h.01M17 9h.01" />
        </svg>
      );
    case "pen-tool":
      return (
        <svg {...props}>
          <path d="m12 19 7-7 3 3-7 7-3-3Z" />
          <path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18M2 2l7.586 7.586M11 11a2 2 0 1 0 2 2" />
        </svg>
      );
    case "plus":
      return (
        <svg {...props}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      );
    case "rotate":
      return (
        <svg {...props}>
          <path d="M20 7v5h-5M4 17v-5h5" />
          <path d="M6.1 9A7 7 0 0 1 18.8 7L20 12M4 12l1.2 5A7 7 0 0 0 17.9 15" />
        </svg>
      );
    case "search":
      return (
        <svg {...props}>
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-4-4" />
        </svg>
      );
    case "share":
      return (
        <svg {...props}>
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <path d="m8.6 10.5 6.8-4M8.6 13.5l6.8 4" />
        </svg>
      );
    case "shield":
      return (
        <svg {...props}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      );
    case "shopping-bag":
      return (
        <svg {...props}>
          <path d="M5 7h14l1 14H4L5 7Z" />
          <path d="M9 9V6a3 3 0 0 1 6 0v3" />
        </svg>
      );
    case "sparkles":
      return (
        <svg {...props}>
          <path d="m12 3-1.1 3.2A5 5 0 0 1 8 9L5 10l3 1a5 5 0 0 1 2.9 2.8L12 17l1.1-3.2A5 5 0 0 1 16 11l3-1-3-1a5 5 0 0 1-2.9-2.8L12 3Z" />
          <path d="m5 3-.3.9A2 2 0 0 1 3.3 4.5L2.5 5l.8.5a2 2 0 0 1 1.4 1.6L5 8l.3-.9a2 2 0 0 1 1.4-1.6l.8-.5-.8-.5A2 2 0 0 1 5.3 3.9L5 3ZM19 16l-.4 1.2a2.2 2.2 0 0 1-1.4 1.4L16 19l.8.4a2.2 2.2 0 0 1 1.4 1.4L19 22l.4-1.2a2.2 2.2 0 0 1 1.4-1.4l.8-.4-.8-.4a2.2 2.2 0 0 1-1.4-1.4L19 16Z" />
        </svg>
      );
    case "smartphone":
      return (
        <svg {...props}>
          <rect x="6" y="2" width="12" height="20" rx="3" />
          <path d="M10 5h4M11 19h2" />
        </svg>
      );
    case "trending":
      return (
        <svg {...props}>
          <path d="m3 17 6-6 4 4 8-8M15 7h6v6" />
        </svg>
      );
    case "users":
      return (
        <svg {...props}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case "zap":
      return (
        <svg {...props}>
          <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z" />
        </svg>
      );
  }
}
