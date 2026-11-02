/** Marks for the places you can reach ALFRED from, each in its own colour. */
export const surfaceColor: Record<string, string> = {
  "Windows PC": "#00a4ef",
  Laptop: "#a5b4fc",
  Android: "#3ddc84",
  Telegram: "#26a5e4",
  WhatsApp: "#25d366",
  Web: "#f59e0b",
  Voice: "#f472b6",
  Hotkey: "#facc15",
  "Any MCP server": "#c084fc",
};

export function SurfaceLogo({ name, className = "" }: { name: string; className?: string }) {
  const p = { viewBox: "0 0 24 24", className, "aria-hidden": true } as const;
  const line = { fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round" } as const;

  switch (name) {
    case "Windows PC":
      return (
        <svg {...p} fill="currentColor">
          <path d="M3 5.3 10.4 4.3v7.1H3zM11.4 4.1 21 2.8v8.6h-9.6zM3 12.6h7.4v7.1L3 18.7zM11.4 12.6H21v8.6l-9.6-1.3z" />
        </svg>
      );
    case "Laptop":
      return (
        <svg {...p} {...line}>
          <rect x="4.5" y="5" width="15" height="10.5" rx="1.5" />
          <path d="M2.5 19h19" />
        </svg>
      );
    case "Android":
      return (
        <svg {...p} fill="currentColor">
          <path d="M3.5 17.5a8.5 8.5 0 0 1 17 0z" />
          <path d="m6.2 9.6-1.7-2.9M17.8 9.6l1.7-2.9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="8.6" cy="14" r="1.05" className="fill-canvas" />
          <circle cx="15.4" cy="14" r="1.05" className="fill-canvas" />
        </svg>
      );
    case "Telegram":
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="10" fill="currentColor" />
          <path d="m6.2 11.8 10.6-4.1c.5-.2.9.1.8.8l-1.8 8.5c-.1.6-.5.7-1 .5l-2.8-2.1-1.4 1.3c-.2.2-.3.3-.6.3l.2-2.9 5.3-4.8c.2-.2 0-.3-.3-.1l-6.6 4.1-2.8-.9c-.6-.2-.6-.6.4-.6z" className="fill-canvas" />
        </svg>
      );
    case "WhatsApp":
      return (
        <svg {...p}>
          <path d="M12 2.8a9.2 9.2 0 0 0-7.9 13.9L3 21l4.4-1.1A9.2 9.2 0 1 0 12 2.8z" fill="currentColor" />
          <path
            d="M9 7.6c.2 0 .4 0 .6.4l.8 1.9c.1.2 0 .4-.1.6l-.6.7c-.1.1-.2.3 0 .5a7 7 0 0 0 3.4 3c.2.1.4.1.5-.1l.7-.9c.2-.2.4-.2.6-.1l1.8.9c.3.1.4.2.4.4 0 .5-.2 1.2-.8 1.6-.6.5-1.6.6-2.9.1a10.4 10.4 0 0 1-5-4.6c-.6-1.1-.6-2.2-.1-2.9.3-.5.6-.6.8-.6z"
            className="fill-canvas"
          />
        </svg>
      );
    case "Web":
      return (
        <svg {...p} {...line}>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3c2.5 2.6 3.7 5.6 3.7 9s-1.2 6.4-3.7 9c-2.5-2.6-3.7-5.6-3.7-9S9.5 5.6 12 3z" />
        </svg>
      );
    case "Voice":
      return (
        <svg {...p} {...line}>
          <path d="M4 10v4M8 7v10M12 4v16M16 7v10M20 10v4" />
        </svg>
      );
    case "Hotkey":
      return (
        <svg {...p} {...line}>
          <rect x="3" y="5" width="18" height="14" rx="3" />
          <path d="M7 15h10M7 10h.01M10.3 10h.01M13.7 10h.01M17 10h.01" />
        </svg>
      );
    case "Any MCP server":
      return (
        <svg {...p} {...line}>
          <path d="M4.5 11.5 11.8 4.2a2.8 2.8 0 0 1 4 4L9.6 14.4" />
          <path d="m10 8.3-5.4 5.4a2.8 2.8 0 0 0 4 4l1.7-1.7" />
          <path d="M15.8 8.2a2.8 2.8 0 0 1 4 4l-6.6 6.6a.6.6 0 0 0 0 .9l1.3 1.3" />
        </svg>
      );
    default:
      return null;
  }
}
