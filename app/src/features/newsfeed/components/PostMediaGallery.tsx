import { ChevronLeft, ChevronRight, Film, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { SafeImage, Skeleton } from "../../../components/ui";

function isVideo(source: string, mediaType?: string | null) {
  return mediaType === "video" || /\.(mp4|webm|mov|m4v)(\?|$)/i.test(source);
}

function MediaTile({
  index,
  mediaType,
  onOpen,
  source,
}: {
  index: number;
  mediaType?: string | null;
  onOpen: () => void;
  source: string;
}) {
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const video = isVideo(source, mediaType);
  return (
    <button
      className="post-media__tile"
      type="button"
      onClick={onOpen}
      aria-label={`Open ${video ? "video" : "image"} ${index + 1}`}
      data-state={state}
    >
      {state === "loading" ? <Skeleton className="post-media__skeleton" height="100%" /> : null}
      {video ? (
        <video
          src={source}
          muted
          playsInline
          preload="metadata"
          onLoadedData={() => setState("ready")}
          onError={() => setState("error")}
        />
      ) : (
        <SafeImage
          src={source}
          fallback="/media-fallback.svg"
          alt=""
          onLoad={() => setState((current) => (current === "error" ? "error" : "ready"))}
          onError={() => setState("error")}
        />
      )}
      {video ? (
        <span className="post-media__type">
          <Film size={13} />
          Video
        </span>
      ) : null}
      {state === "error" ? (
        <span className="post-media__unavailable">Media unavailable</span>
      ) : null}
    </button>
  );
}

function MediaViewer({
  initialIndex,
  media,
  mediaType,
  onClose,
}: {
  initialIndex: number;
  media: string[];
  mediaType?: string | null;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(initialIndex);
  const [loading, setLoading] = useState(true);
  const closeRef = useRef<HTMLButtonElement>(null);
  const previousFocus = useRef<HTMLElement | null>(document.activeElement as HTMLElement | null);
  const onCloseRef = useRef(onClose);
  const source = media[index];
  const video = isVideo(source, mediaType);
  const move = (direction: number) => {
    setLoading(true);
    setIndex((current) => (current + direction + media.length) % media.length);
  };

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    closeRef.current?.focus();
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseRef.current();
      if (event.key === "ArrowLeft" && media.length > 1) move(-1);
      if (event.key === "ArrowRight" && media.length > 1) move(1);
      if (event.key === "Tab") {
        const controls = Array.from(
          document.querySelectorAll<HTMLElement>(
            ".media-viewer button, .media-viewer video[controls]",
          ),
        );
        if (!controls.length) return;
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", keyboard);
    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", keyboard);
      previousFocus.current?.focus();
    };
  }, [media.length]);

  useEffect(() => {
    [-1, 1].forEach((offset) => {
      const candidate = media[(index + offset + media.length) % media.length];
      if (candidate && !isVideo(candidate, mediaType)) {
        const image = new Image();
        image.src = candidate;
      }
    });
  }, [index, media, mediaType]);

  return createPortal(
    <div
      className="media-viewer"
      role="dialog"
      aria-modal="true"
      aria-label="Post media viewer"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
      onClick={(event) => event.stopPropagation()}
    >
      <header>
        <span>
          {index + 1} of {media.length}
        </span>
        <button ref={closeRef} type="button" onClick={onClose} aria-label="Close media viewer">
          <X size={20} />
        </button>
      </header>
      <div className="media-viewer__stage">
        {loading ? (
          <div className="media-viewer__loading" role="status">
            <i />
            <span>Loading media</span>
          </div>
        ) : null}
        {video ? (
          <video
            key={source}
            src={source}
            controls
            autoPlay
            playsInline
            onLoadedData={() => setLoading(false)}
            onError={() => setLoading(false)}
          />
        ) : (
          <SafeImage
            key={source}
            src={source}
            fallback="/media-fallback.svg"
            alt={`Post media ${index + 1}`}
            onLoad={() => setLoading(false)}
            onError={() => setLoading(false)}
          />
        )}
      </div>
      {media.length > 1 ? (
        <>
          <button
            className="media-viewer__previous"
            type="button"
            onClick={() => move(-1)}
            aria-label="Previous media"
          >
            <ChevronLeft size={23} />
          </button>
          <button
            className="media-viewer__next"
            type="button"
            onClick={() => move(1)}
            aria-label="Next media"
          >
            <ChevronRight size={23} />
          </button>
          <nav aria-label="Choose media">
            {media.map((item, itemIndex) => (
              <button
                type="button"
                key={`${item}-${itemIndex}`}
                className={itemIndex === index ? "is-active" : undefined}
                onClick={() => {
                  setLoading(true);
                  setIndex(itemIndex);
                }}
                aria-label={`View media ${itemIndex + 1}`}
                aria-current={itemIndex === index ? "true" : undefined}
              />
            ))}
          </nav>
        </>
      ) : null}
    </div>,
    document.body,
  );
}

export function PostMediaGallery({
  media,
  mediaType,
}: {
  media: string[];
  mediaType?: string | null;
}) {
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  if (!media.length) return null;
  const visible = media.slice(0, 4);
  return (
    <>
      <div className="post-media" data-count={visible.length}>
        {visible.map((source, index) => (
          <div className="post-media__cell" key={`${source}-${index}`}>
            <MediaTile
              source={source}
              mediaType={mediaType}
              index={index}
              onOpen={() => setViewerIndex(index)}
            />
            {index === 3 && media.length > 4 ? (
              <button
                className="post-media__overflow"
                type="button"
                onClick={() => setViewerIndex(index)}
                aria-label={`Open ${media.length - 4} more media items`}
              >
                +{media.length - 4}
              </button>
            ) : null}
          </div>
        ))}
      </div>
      {viewerIndex !== null ? (
        <MediaViewer
          media={media}
          mediaType={mediaType}
          initialIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
        />
      ) : null}
    </>
  );
}
