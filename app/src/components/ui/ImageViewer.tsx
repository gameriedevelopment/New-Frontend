import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { SafeImage } from "./SafeImage";
import "./ImageViewer.css";

export interface ImageViewerProps {
  src?: string;
  alt?: string;
  fallback?: string;
  shape?: "rect" | "round";
  onClose: () => void;
}

export function ImageViewer({
  src,
  alt = "",
  fallback,
  shape = "rect",
  onClose,
}: ImageViewerProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const previousFocus = useRef<HTMLElement | null>(
    document.activeElement instanceof HTMLElement ? document.activeElement : null,
  );
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("keydown", keyboard);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", keyboard);
      previousFocus.current?.focus();
    };
  }, []);

  return createPortal(
    <div
      className="image-viewer"
      role="dialog"
      aria-modal="true"
      aria-label={alt || "Image preview"}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <button
        ref={closeRef}
        className="image-viewer__close"
        type="button"
        onClick={onClose}
        aria-label="Close"
      >
        <X size={20} />
      </button>
      <figure className="image-viewer__frame" data-shape={shape}>
        <SafeImage src={src} alt={alt} fallback={fallback} />
      </figure>
    </div>,
    document.body,
  );
}
