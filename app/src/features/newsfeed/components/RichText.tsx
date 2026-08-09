import { useMemo, type MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import { renderRichContent } from "../richContent";

export function RichText({ className = "", content }: { className?: string; content: string }) {
  const navigate = useNavigate();
  const html = useMemo(() => renderRichContent(content), [content]);
  const followLink = (event: MouseEvent<HTMLDivElement>) => {
    const anchor = (event.target as Element).closest<HTMLAnchorElement>("a");
    if (!anchor) return;
    event.stopPropagation();
    const url = new URL(anchor.href, window.location.origin);
    if (url.origin === window.location.origin) { event.preventDefault(); navigate(`${url.pathname}${url.search}${url.hash}`); }
  };
  return <div className={`rich-content ${className}`.trim()} onClick={followLink} onError={(event) => { const image = event.target as HTMLImageElement; if (image.tagName === "IMG" && image.dataset.fallbackApplied !== "true") { image.dataset.fallbackApplied = "true"; image.src = "/media-fallback.svg"; } }} dangerouslySetInnerHTML={{ __html: html }} />;
}
