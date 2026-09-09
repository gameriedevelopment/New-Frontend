import type { ReactNode } from "react";
import { playerAppHref } from "../lib/playerApp";

export function PlayerAppLink({
  segments,
  children,
  variant = "primary",
  className = "",
}: {
  segments: string[];
  children: ReactNode;
  variant?: "primary" | "secondary" | "text";
  className?: string;
}) {
  return (
    <a
      className={`${variant === "primary" ? "admin-primary-button" : variant === "secondary" ? "admin-secondary-button" : "admin-player-app-link"} ${className}`.trim()}
      href={playerAppHref(...segments)}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  );
}
