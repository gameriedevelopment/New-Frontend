import { AlertCircle, Check, Copy, Download, ExternalLink, Lock, Share2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button, Skeleton, StatePanel } from "../../components/ui";
import { getApiErrorMessage } from "../../lib/errors";
import { PlayerCard } from "./components/PlayerCard";
import { usePublicPlayerCard } from "./hooks";
import { buildPlayerCardModel } from "./playerCard";
import "./playerCard.css";

type ActionState = "idle" | "working" | "done" | "error";

async function copyText(value: string) {
  if (window.isSecureContext && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }
  const field = document.createElement("textarea");
  field.value = value;
  field.setAttribute("readonly", "");
  field.style.position = "fixed";
  field.style.opacity = "0";
  document.body.appendChild(field);
  field.select();
  const copied = document.execCommand("copy");
  field.remove();
  if (!copied) throw new Error("Clipboard access is unavailable.");
}

function updateMeta(name: string, content: string, property = false) {
  const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`;
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(property ? "property" : "name", name);
    document.head.appendChild(element);
  }
  element.content = content;
}

export function PlayerCardPage() {
  const { username } = useParams();
  const query = usePublicPlayerCard(username);
  const [copyState, setCopyState] = useState<ActionState>("idle");
  const [downloadState, setDownloadState] = useState<ActionState>("idle");
  const model = useMemo(
    () => (query.data?.shareable ? buildPlayerCardModel(query.data) : null),
    [query.data],
  );
  const shareUrl = `${window.location.origin}/s/${encodeURIComponent(username || "")}`;

  useEffect(() => {
    if (!model) return;
    const title = `${model.username} — Gamerie player card`;
    const description = `${model.title}${model.game ? ` · ${model.game.name}` : ""}. View this player identity on Gamerie.`;
    document.title = title;
    updateMeta("description", description);
    updateMeta("og:title", title, true);
    updateMeta("og:description", description, true);
    updateMeta("og:url", shareUrl, true);
    updateMeta("og:type", "profile", true);
  }, [model, shareUrl]);

  const copyLink = async () => {
    setCopyState("working");
    try {
      await copyText(shareUrl);
      setCopyState("done");
      window.setTimeout(() => setCopyState("idle"), 2400);
    } catch {
      setCopyState("error");
    }
  };

  const share = async () => {
    if (!model) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${model.username}'s Gamerie player card`,
          text: `${model.title}${model.game ? ` · ${model.game.name}` : ""}`,
          url: shareUrl,
        });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    await copyLink();
  };

  const download = async () => {
    if (!model) return;
    setDownloadState("working");
    try {
      const { renderPlayerCardPng } = await import("./renderPlayerCardPng");
      const blob = await renderPlayerCardPng(model);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${model.username.replace(/[^a-z0-9_-]+/gi, "-")}-gamerie-card.png`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
      setDownloadState("done");
      window.setTimeout(() => setDownloadState("idle"), 2400);
    } catch {
      setDownloadState("error");
    }
  };

  if (query.isLoading)
    return (
      <main className="player-card-page">
        <div className="player-card-page__loading" role="status" aria-label="Loading player card">
          <Skeleton height={650} />
          <Skeleton height={280} />
        </div>
      </main>
    );

  if (query.isError || !query.data)
    return (
      <main className="player-card-page player-card-page--state">
        <StatePanel
          tone="error"
          icon={<AlertCircle size={20} />}
          title="Player card unavailable"
          description={getApiErrorMessage(
            query.error,
            "This player card may not exist, or Gamerie could not load it right now.",
          )}
          action={
            <Button size="small" variant="secondary" onClick={() => query.refetch()}>
              Try again
            </Button>
          }
        />
      </main>
    );

  if (!query.data.shareable || !model)
    return (
      <main className="player-card-page player-card-page--state">
        <StatePanel
          icon={<Lock size={20} />}
          title="This card is not public"
          description="The player has limited their profile visibility. Gamerie does not expose private player data through shared cards."
          action={
            <Link className="g-button" data-variant="secondary" data-size="small" to="/login">
              Open Gamerie
            </Link>
          }
        />
      </main>
    );

  return (
    <main className="player-card-page">
      <section className="player-card-page__preview">
        <PlayerCard model={model} />
      </section>
      <aside className="player-card-page__details">
        <p className="player-card-page__eyebrow">Public player identity</p>
        <h2>Built to be shared. Grounded in available data.</h2>
        <p>
          This card uses Gamerie records and clearly identifies player-listed or community-endorsed
          strengths. It does not infer a Player DNA score or invent missing statistics.
        </p>
        <div className="player-card-page__actions">
          <Button
            size="large"
            disabled={downloadState === "working"}
            onClick={() => void download()}
          >
            {downloadState === "done" ? <Check size={17} /> : <Download size={17} />}
            {downloadState === "working"
              ? "Preparing PNG…"
              : downloadState === "done"
                ? "PNG downloaded"
                : "Download PNG"}
          </Button>
          <div>
            <Button variant="secondary" onClick={() => void copyLink()}>
              {copyState === "done" ? <Check size={16} /> : <Copy size={16} />}
              {copyState === "done" ? "Copied" : "Copy link"}
            </Button>
            <Button variant="secondary" onClick={() => void share()}>
              <Share2 size={16} />
              Share
            </Button>
          </div>
        </div>
        {copyState === "error" ? (
          <p className="player-card-page__feedback" role="alert">
            The link could not be copied. Copy it from your browser address bar instead.
          </p>
        ) : null}
        {downloadState === "error" ? (
          <p className="player-card-page__feedback" role="alert">
            The PNG could not be generated in this browser. Please try again.
          </p>
        ) : null}
        <dl className="player-card-page__provenance">
          <div>
            <dt>Competitive statistics</dt>
            <dd>Recorded by Gamerie</dd>
          </div>
          <div>
            <dt>Player title and listed skills</dt>
            <dd>Player provided</dd>
          </div>
          <div>
            <dt>Skill endorsements</dt>
            <dd>Community recorded</dd>
          </div>
        </dl>
        <Link className="player-card-page__profile-link" to={`/profile/${model.username}`}>
          Open full profile <ExternalLink size={14} />
        </Link>
      </aside>
      <p className="sr-only" aria-live="polite">
        {copyState === "done" ? "Player card link copied." : ""}
        {downloadState === "done" ? "Player card PNG downloaded." : ""}
      </p>
    </main>
  );
}
