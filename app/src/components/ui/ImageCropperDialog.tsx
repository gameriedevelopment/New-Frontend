import { RotateCcw, X, ZoomIn } from "lucide-react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { createPortal } from "react-dom";
import { Button } from "./Button";
import "./ImageCropperDialog.css";

export interface ImageCropperDialogProps {
  file: File;
  aspect: number;
  shape?: "rect" | "round";
  title?: string;
  outputWidth?: number;
  onCancel: () => void;
  onCropped: (file: File) => void;
}

type Offset = { x: number; y: number };

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;

export function ImageCropperDialog({
  file,
  aspect,
  shape = "rect",
  title = "Adjust image",
  outputWidth = 1024,
  onCancel,
  onCropped,
}: ImageCropperDialogProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const dragState = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    origin: Offset;
  } | null>(null);
  const [src, setSrc] = useState("");
  const [natural, setNatural] = useState<{ width: number; height: number } | null>(null);
  const [frame, setFrame] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState<Offset>({ x: 0, y: 0 });

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setSrc(url);
    const image = new Image();
    image.onload = () => {
      imageRef.current = image;
      setNatural({ width: image.naturalWidth, height: image.naturalHeight });
    };
    image.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // Measure the crop frame so we can map screen coordinates to the source image.
  useLayoutEffect(() => {
    const measure = () => {
      const node = frameRef.current;
      if (!node) return;
      setFrame({ width: node.clientWidth, height: node.clientHeight });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [natural, aspect]);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", key);
    };
  }, [onCancel]);

  // The base scale makes the image "cover" the frame at zoom 1.
  const baseScale =
    natural && frame.width
      ? Math.max(frame.width / natural.width, frame.height / natural.height)
      : 1;

  const clampOffset = useCallback(
    (next: Offset, activeZoom: number): Offset => {
      if (!natural || !frame.width) return { x: 0, y: 0 };
      const scaledWidth = natural.width * baseScale * activeZoom;
      const scaledHeight = natural.height * baseScale * activeZoom;
      const maxX = Math.max(0, (scaledWidth - frame.width) / 2);
      const maxY = Math.max(0, (scaledHeight - frame.height) / 2);
      return {
        x: Math.min(maxX, Math.max(-maxX, next.x)),
        y: Math.min(maxY, Math.max(-maxY, next.y)),
      };
    },
    [baseScale, frame.height, frame.width, natural],
  );

  useEffect(() => {
    setOffset((current) => clampOffset(current, zoom));
  }, [clampOffset, zoom]);

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragState.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      origin: offset,
    };
  };
  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragState.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    setOffset(
      clampOffset(
        {
          x: drag.origin.x + (event.clientX - drag.startX),
          y: drag.origin.y + (event.clientY - drag.startY),
        },
        zoom,
      ),
    );
  };
  const endDrag = () => {
    dragState.current = null;
  };

  const reset = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  const confirm = () => {
    const image = imageRef.current;
    if (!image || !natural || !frame.width) return;
    const outputHeight = Math.round(outputWidth / aspect);
    const canvas = document.createElement("canvas");
    canvas.width = outputWidth;
    canvas.height = outputHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Map the frame's visible region back onto the source image.
    const displayScale = baseScale * zoom;
    const visibleSourceWidth = frame.width / displayScale;
    const visibleSourceHeight = frame.height / displayScale;
    const sourceCenterX = natural.width / 2 - offset.x / displayScale;
    const sourceCenterY = natural.height / 2 - offset.y / displayScale;
    const sx = sourceCenterX - visibleSourceWidth / 2;
    const sy = sourceCenterY - visibleSourceHeight / 2;

    ctx.drawImage(
      image,
      sx,
      sy,
      visibleSourceWidth,
      visibleSourceHeight,
      0,
      0,
      outputWidth,
      outputHeight,
    );

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const type = blob.type || "image/jpeg";
        const ext = type.includes("png") ? "png" : "jpg";
        const base = file.name.replace(/\.[^.]+$/, "") || "image";
        onCropped(new File([blob], `${base}-cropped.${ext}`, { type }));
      },
      file.type === "image/png" ? "image/png" : "image/jpeg",
      0.92,
    );
  };

  const transform = natural
    ? `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px) scale(${baseScale * zoom})`
    : undefined;

  return createPortal(
    <div
      className="image-cropper"
      role="dialog"
      aria-modal="true"
      aria-labelledby="image-cropper-title"
    >
      <button
        className="image-cropper__scrim"
        type="button"
        aria-label="Cancel"
        onClick={onCancel}
      />
      <section>
        <header>
          <h2 id="image-cropper-title">{title}</h2>
          <button type="button" onClick={onCancel} aria-label="Close">
            <X size={18} />
          </button>
        </header>
        <p className="image-cropper__hint">
          Drag to reposition and zoom to crop. Only the {shape === "round" ? "circle" : "framed"}{" "}
          area is saved.
        </p>
        <div
          className="image-cropper__stage"
          data-shape={shape}
          ref={frameRef}
          style={{ aspectRatio: String(aspect) }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          {src ? (
            <img
              className="image-cropper__image"
              src={src}
              alt=""
              draggable={false}
              style={transform ? { transform } : undefined}
            />
          ) : null}
          <span className="image-cropper__frame" aria-hidden />
        </div>
        <div className="image-cropper__controls">
          <ZoomIn size={16} />
          <input
            type="range"
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step={0.01}
            value={zoom}
            aria-label="Zoom"
            onChange={(event) => setZoom(Number(event.target.value))}
          />
          <button type="button" className="image-cropper__reset" onClick={reset}>
            <RotateCcw size={14} />
            Reset
          </button>
        </div>
        <footer>
          <Button variant="quiet" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={confirm} disabled={!natural}>
            Apply
          </Button>
        </footer>
      </section>
    </div>,
    document.body,
  );
}
