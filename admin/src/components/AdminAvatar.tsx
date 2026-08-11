import { useEffect, useState } from "react";

interface AdminAvatarProps {
  name: string;
  src?: string | null;
  shape?: "circle" | "rounded";
  className?: string;
}

export function AdminAvatar({ name, src, shape = "circle", className = "" }: AdminAvatarProps) {
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [src]);

  const initials =
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "?";

  return (
    <span
      className={`admin-directory-avatar${shape === "rounded" ? " admin-directory-avatar--rounded" : ""}${className ? ` ${className}` : ""}`}
      aria-hidden="true"
    >
      <span>{initials}</span>
      {src && !failed ? (
        <img src={src} alt="" loading="lazy" onError={() => setFailed(true)} />
      ) : null}
    </span>
  );
}
