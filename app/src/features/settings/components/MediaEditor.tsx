import { Camera, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ImageCropperDialog, SafeImage } from "../../../components/ui";
import { getApiErrorMessage } from "../../../lib/errors";
import { useUploadPlayerImage } from "../../profile/hooks";
import type { PlayerProfile } from "../../profile/types";

type MediaType = "profileImage" | "backgroundImage";

export function MediaEditor({ profile }: { profile: PlayerProfile }) {
  const upload = useUploadPlayerImage(profile.id);
  const [validationError, setValidationError] = useState("");
  const [cropping, setCropping] = useState<{ file: File; type: MediaType } | null>(null);
  const [preview, setPreview] = useState<Partial<Record<MediaType, string>>>({});
  const urls = useRef<string[]>([]);
  useEffect(() => () => urls.current.forEach(URL.revokeObjectURL), []);
  const choose = (type: MediaType, file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return setValidationError("Choose an image file.");
    if (file.size > 5 * 1024 * 1024)
      return setValidationError("Choose an image smaller than 5 MB.");
    setValidationError("");
    setCropping({ file, type });
  };
  const applyCrop = (file: File) => {
    if (!cropping) return;
    const type = cropping.type;
    setCropping(null);
    const url = URL.createObjectURL(file);
    urls.current.push(url);
    setPreview((current) => ({ ...current, [type]: url }));
    upload.mutate({ file, type });
  };
  return (
    <section className="settings-form">
      <div className="settings-section-heading">
        <p>Profile media</p>
        <h2>Avatar and cover</h2>
        <span>
          Use clear, high-quality images that remain legible across feeds and compact player cards.
        </span>
      </div>
      <div className="settings-media-cover">
        <div>
          <SafeImage
            src={preview.backgroundImage || profile.backgroundImage}
            fallback="/profile-cover-fallback.jpg"
            alt="Cover preview"
          />
        </div>
        <label>
          <Upload size={15} />
          <span>
            {upload.isPending && upload.variables?.type === "backgroundImage"
              ? "Uploading…"
              : "Change cover"}
          </span>
          <input
            type="file"
            accept="image/*"
            disabled={upload.isPending}
            onChange={(event) => {
              choose("backgroundImage", event.target.files?.[0]);
              event.target.value = "";
            }}
          />
        </label>
      </div>
      <div className="settings-media-avatar">
        <SafeImage src={preview.profileImage || profile.profileImage} alt="Profile preview" />
        <div>
          <h3>Profile image</h3>
          <p>Square image, up to 5 MB. Gamerie will crop it to a circle where needed.</p>
          <label>
            <Camera size={15} />
            <span>
              {upload.isPending && upload.variables?.type === "profileImage"
                ? "Uploading…"
                : "Choose image"}
            </span>
            <input
              type="file"
              accept="image/*"
              disabled={upload.isPending}
              onChange={(event) => {
                choose("profileImage", event.target.files?.[0]);
                event.target.value = "";
              }}
            />
          </label>
        </div>
      </div>
      {validationError || upload.isError ? (
        <p className="settings-error" role="alert">
          {validationError ||
            getApiErrorMessage(
              upload.error,
              "That image could not be uploaded. Use an image under 5 MB and try again.",
            )}
        </p>
      ) : null}
      {upload.isSuccess ? (
        <p className="settings-success" role="status">
          Profile media updated.
        </p>
      ) : null}
      {cropping ? (
        <ImageCropperDialog
          file={cropping.file}
          aspect={cropping.type === "profileImage" ? 1 : 16 / 6}
          shape={cropping.type === "profileImage" ? "round" : "rect"}
          title={cropping.type === "profileImage" ? "Adjust profile image" : "Adjust cover image"}
          onCancel={() => setCropping(null)}
          onCropped={applyCrop}
        />
      ) : null}
    </section>
  );
}
