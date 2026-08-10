import { ImagePlus, Send, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { SafeImage } from "../../../components/ui";
import { getApiErrorMessage } from "../../../lib/errors";
import { useAuthStore } from "../../auth/authStore";
import { useCreateCommunityPost, useCreatePost } from "../hooks";
import { firstContentUrl } from "../richContent";
import { LinkPreviewCard } from "./LinkPreviewCard";
import { RichPostEditor } from "./RichPostEditor";
import { getProfileCompletion } from "../../profile/profileCompletion";

const MAX_MEDIA = 4;
const MAX_CONTENT = 2000;

interface FeedComposerProps {
  community?: {
    id: string;
    kind: "team" | "hub";
    name: string;
    canAnnounce: boolean;
  };
}

export function FeedComposer({ community }: FeedComposerProps = {}) {
  const user = useAuthStore((state) => state.user);
  const personalMutation = useCreatePost(user?.id);
  const communityMutation = useCreateCommunityPost(
    community?.kind ?? "team",
    community?.id ?? "",
    user?.id,
  );
  const mutation = community ? communityMutation : personalMutation;
  const [expanded, setExpanded] = useState(false);
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [dismissedUrl, setDismissedUrl] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const score = getProfileCompletion(user).score;
  const canPost = Boolean(community) || score >= 50;
  const detectedUrl = firstContentUrl(content);
  const overLimit = content.length > MAX_CONTENT;

  useEffect(() => {
    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviews(urls);
    return () => urls.forEach(URL.revokeObjectURL);
  }, [files]);

  const chooseMedia = (incoming: FileList | null) => {
    if (!incoming) return;
    const selected = Array.from(incoming);
    if (files.length + selected.length > MAX_MEDIA) {
      setMediaError(`Choose up to ${MAX_MEDIA} media files per post.`);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    setMediaError(null);
    setFiles((current) => [...current, ...selected]);
    if (inputRef.current) inputRef.current.value = "";
    setExpanded(true);
  };

  const submit = async () => {
    const clean = content.trim();
    if (!clean || overLimit || mutation.isPending) return;
    try {
      await mutation.mutateAsync({
        content: clean,
        media: files,
        isAnnouncement: community?.canAnnounce ? announcement : false,
      });
      setContent("");
      setFiles([]);
      setExpanded(false);
      setDismissedUrl(null);
      setAnnouncement(false);
    } catch {
      // Mutation state renders the API error in context.
    }
  };

  if (!canPost)
    return (
      <section className="feed-composer feed-composer--locked">
        <div>
          <strong>Complete your profile to post</strong>
          <p>
            Add enough of your gaming identity to reach 50% profile completion.
          </p>
          <span>
            <i style={{ width: `${score}%` }} />
          </span>
          <small>{score}% complete</small>
        </div>
        <Link to={`/profile/${user?.username ?? user?.id}`}>
          Continue profile
        </Link>
      </section>
    );

  return (
    <section
      className="feed-composer"
      data-expanded={expanded || Boolean(content) || files.length > 0}
    >
      <button
        className="feed-composer__prompt"
        type="button"
        onClick={() => setExpanded(true)}
        aria-expanded={expanded}
      >
        {user?.profileImage ? (
          <SafeImage className="feed-avatar" src={user.profileImage} alt="" />
        ) : (
          <span className="feed-avatar">
            {(user?.username || user?.email || "G").slice(0, 2).toUpperCase()}
          </span>
        )}
        <span>
          {community
            ? `Share an update with ${community.name}`
            : "Share something with the community"}
        </span>
        <Send size={16} />
      </button>
      <div className="feed-composer__editor">
        <div className="feed-composer__heading">
          <label>
            {community ? `Post to ${community.name}` : "Create a post"}
          </label>
          {community?.canAnnounce ? (
            <label className="feed-composer__announcement">
              <input
                type="checkbox"
                checked={announcement}
                onChange={(event) => setAnnouncement(event.target.checked)}
              />
              <span>Publish as announcement</span>
            </label>
          ) : null}
        </div>
        <RichPostEditor
          expanded={expanded}
          value={content}
          onChange={(next) => {
            setContent(next);
            if (firstContentUrl(next) !== dismissedUrl) setDismissedUrl(null);
          }}
          onSubmit={submit}
        />
        {previews.length ? (
          <div className="feed-composer__previews">
            {previews.map((preview, index) => (
              <figure key={preview}>
                {files[index]?.type.startsWith("video/") ? (
                  <video src={preview} muted playsInline />
                ) : (
                  <img src={preview} alt={`Selected media ${index + 1}`} />
                )}
                <button
                  type="button"
                  onClick={() => {
                    setFiles((current) =>
                      current.filter((_, fileIndex) => fileIndex !== index),
                    );
                    setMediaError(null);
                  }}
                  aria-label={`Remove selected media ${index + 1}`}
                >
                  <X size={15} />
                </button>
                <figcaption>
                  {files[index]?.type.startsWith("video/") ? "Video" : "Image"}{" "}
                  {index + 1}
                </figcaption>
              </figure>
            ))}
          </div>
        ) : null}
        {detectedUrl && detectedUrl !== dismissedUrl ? (
          <LinkPreviewCard
            content={content}
            onDismiss={() => setDismissedUrl(detectedUrl)}
          />
        ) : null}
        {mediaError ? (
          <p className="feed-inline-error" role="alert">
            {mediaError}
          </p>
        ) : null}
        {overLimit ? (
          <p className="feed-inline-error" role="alert">
            Posts can contain up to {MAX_CONTENT.toLocaleString()} characters.
          </p>
        ) : null}
        {mutation.isError ? (
          <p className="feed-inline-error" role="alert">
            {getApiErrorMessage(
              mutation.error,
              "Your post could not be published. Please try again.",
            )}
          </p>
        ) : null}
        <footer>
          <div>
            <label className="feed-composer__media">
              <ImagePlus size={17} />
              <span>Add media</span>
              <input
                ref={inputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={(event) => chooseMedia(event.target.files)}
              />
            </label>
            <small>
              {files.length
                ? `${files.length} of ${MAX_MEDIA} files · ${content.length} / ${MAX_CONTENT}`
                : `${content.length} / ${MAX_CONTENT}`}
            </small>
          </div>
          <div>
            <button
              className="feed-composer__cancel"
              type="button"
              onClick={() => {
                setExpanded(false);
                setContent("");
                setFiles([]);
                setMediaError(null);
                setDismissedUrl(null);
                setAnnouncement(false);
              }}
            >
              Cancel
            </button>
            <button
              className="feed-composer__publish"
              type="button"
              disabled={!content.trim() || overLimit || mutation.isPending}
              onClick={submit}
            >
              {mutation.isPending
                ? "Publishing…"
                : announcement
                  ? "Publish announcement"
                  : "Publish"}
              <Send size={15} />
            </button>
          </div>
        </footer>
      </div>
    </section>
  );
}
