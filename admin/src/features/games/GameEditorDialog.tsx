import { useEffect, useId, useState, type FormEvent } from "react";
import { getErrorMessage } from "../../lib/errors";
import type { AdminGameInput, AdminGameRecord } from "./types";

interface GameEditorDialogProps {
  open: boolean;
  game?: AdminGameRecord | null;
  busy: boolean;
  error?: unknown;
  onClose: () => void;
  onSave: (input: AdminGameInput) => void;
}

const splitList = (value: string) =>
  Array.from(
    new Set(
      value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );

export function GameEditorDialog({
  open,
  game,
  busy,
  error,
  onClose,
  onSave,
}: GameEditorDialogProps) {
  const titleId = useId();
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [gameType, setGameType] = useState("");
  const [integrationKey, setIntegrationKey] = useState("");
  const [description, setDescription] = useState("");
  const [platforms, setPlatforms] = useState("");
  const [gameModes, setGameModes] = useState("");
  const [requiredSkills, setRequiredSkills] = useState("");
  const [officialWebsite, setOfficialWebsite] = useState("");
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(game?.name ?? "");
    setCompany(game?.company ?? "");
    setGameType(game?.gameType ?? "");
    setIntegrationKey(game?.integrationKey ?? "");
    setDescription(game?.description ?? "");
    setPlatforms(game?.platforms?.join(", ") ?? "");
    setGameModes(game?.gameModes?.join(", ") ?? "");
    setRequiredSkills(game?.requiredSkills?.join(", ") ?? "");
    setOfficialWebsite(game?.officialWebsite ?? "");
    setFile(null);
  }, [game, open]);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) onClose();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [busy, onClose, open]);

  if (!open) return null;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSave({
      name,
      company,
      gameType,
      integrationKey,
      description,
      platforms: splitList(platforms),
      gameModes: splitList(gameModes),
      requiredSkills: splitList(requiredSkills),
      officialWebsite,
      file,
    });
  };

  return (
    <div className="admin-dialog admin-game-dialog" role="presentation" onMouseDown={onClose}>
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onSubmit={submit}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header>
          <span className="admin-eyebrow">Catalogue record</span>
          <h2 id={titleId}>{game ? "Edit game" : "Add a game"}</h2>
          <p>
            Keep discovery metadata accurate. Every saved change is written to the admin audit
            trail.
          </p>
        </header>
        <div className="admin-game-form-grid">
          <label>
            <span>Name</span>
            <input
              autoFocus
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              maxLength={120}
            />
          </label>
          <label>
            <span>Studio or publisher</span>
            <input
              value={company}
              onChange={(event) => setCompany(event.target.value)}
              required
              maxLength={120}
            />
          </label>
          <label>
            <span>Game type</span>
            <input
              value={gameType}
              onChange={(event) => setGameType(event.target.value)}
              placeholder="e.g. Tactical FPS"
              required
              maxLength={80}
            />
          </label>
          <label>
            <span>
              Integration key <small>Optional</small>
            </span>
            <input
              value={integrationKey}
              onChange={(event) => setIntegrationKey(event.target.value)}
              placeholder="e.g. counter-strike-2"
              maxLength={100}
            />
          </label>
          <label className="admin-game-form-wide">
            <span>Description</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              required
              minLength={10}
              maxLength={3000}
            />
          </label>
          <label>
            <span>
              Platforms <small>Comma separated</small>
            </span>
            <input
              value={platforms}
              onChange={(event) => setPlatforms(event.target.value)}
              placeholder="PC, PS5, Xbox"
              required
            />
          </label>
          <label>
            <span>
              Game modes <small>Comma separated</small>
            </span>
            <input
              value={gameModes}
              onChange={(event) => setGameModes(event.target.value)}
              placeholder="Ranked, Casual"
              required
            />
          </label>
          <label>
            <span>
              Required skills <small>Comma separated</small>
            </span>
            <input
              value={requiredSkills}
              onChange={(event) => setRequiredSkills(event.target.value)}
              placeholder="Aim, Strategy, Teamwork"
            />
          </label>
          <label>
            <span>Official website</span>
            <input
              type="url"
              value={officialWebsite}
              onChange={(event) => setOfficialWebsite(event.target.value)}
              placeholder="https://"
              required
            />
          </label>
          <label className="admin-game-form-wide admin-game-file">
            <span>
              Catalogue image{" "}
              {game ? <small>Leave empty to keep current</small> : <small>Optional</small>}
            </span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
          </label>
        </div>
        {error ? (
          <p className="admin-dialog__error" role="alert">
            {getErrorMessage(error, "The game could not be saved.")}
          </p>
        ) : null}
        <footer>
          <button
            type="button"
            className="admin-secondary-button"
            onClick={onClose}
            disabled={busy}
          >
            Cancel
          </button>
          <button type="submit" className="admin-primary-button" disabled={busy}>
            {busy ? "Saving…" : game ? "Save changes" : "Add game"}
          </button>
        </footer>
      </form>
    </div>
  );
}
