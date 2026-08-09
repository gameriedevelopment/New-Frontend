import { ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { SafeImage, Skeleton } from "../../../components/ui";
import { useLinkPreview } from "../hooks";
import { firstContentUrl } from "../richContent";

export function LinkPreviewCard({ content, onDismiss }: { content: string; onDismiss?: () => void }) {
  const url = firstContentUrl(content);
  const query = useLinkPreview(url);
  if (!url) return null;
  if (query.isLoading && onDismiss) return <div className="link-preview-loading" aria-label="Loading link preview"><div><Skeleton width="34%" height={8} /><Skeleton width="82%" height={11} /><Skeleton width="64%" height={8} /></div><Skeleton width={128} height="100%" /></div>;
  if (query.isLoading || query.isError || !query.data || (!query.data.title && !query.data.image)) return null;
  const preview = query.data;
  let internalPath: string | null = null;
  try { const parsed = new URL(url); if (parsed.origin === window.location.origin) internalPath = `${parsed.pathname}${parsed.search}`; } catch { /* Invalid URLs render as external. */ }
  const body = <><div className="link-preview__body">{preview.siteName ? <span>{preview.siteName}</span> : null}{preview.title ? <strong>{preview.title}</strong> : null}{preview.description ? <p>{preview.description}</p> : null}<small>{url}<ExternalLink size={12} /></small></div>{preview.image ? <SafeImage src={preview.image} fallback="/media-fallback.svg" alt="" /> : null}</>;
  const card = internalPath ? <Link className="link-preview" to={internalPath}>{body}</Link> : <a className="link-preview" href={url} target="_blank" rel="noopener noreferrer">{body}</a>;
  return onDismiss ? <div className="link-preview-wrap">{card}<button type="button" onClick={onDismiss} aria-label="Remove link preview">×</button></div> : card;
}
