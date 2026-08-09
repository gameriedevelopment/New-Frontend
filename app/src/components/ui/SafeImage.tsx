import { useEffect, useState, type ImgHTMLAttributes } from "react";

export interface SafeImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> {
  fallback?: string;
  src?: string | null;
}

export function SafeImage({ src, fallback = "/avatar-fallback.svg", onError, ...props }: SafeImageProps) {
  const [imageSource, setImageSource] = useState(src || fallback);

  useEffect(() => setImageSource(src || fallback), [fallback, src]);

  return <img
    {...props}
    src={imageSource}
    loading={props.loading ?? "lazy"}
    onError={(event) => {
      onError?.(event);
      if (imageSource !== fallback) setImageSource(fallback);
    }}
  />;
}
