import { useState } from "react";
import { Button } from "../../../components/ui";
import { getApiErrorMessage } from "../../../lib/errors";
import { useUpdatePlayerSettings } from "../hooks";
import type { PlayerSettings, PrivacySettings } from "../types";

const sharing: Array<{ key: keyof PrivacySettings; label: string; description: string }> = [
  {
    key: "showOnlineStatus",
    label: "Online status",
    description: "Let other players see when you are active.",
  },
  {
    key: "showGameActivity",
    label: "Game activity",
    description: "Show recent game activity on your profile.",
  },
  {
    key: "showFullName",
    label: "Full name",
    description: "Share your name when your profile is visible.",
  },
  { key: "showAge", label: "Age", description: "Show your derived age, never your date of birth." },
  {
    key: "showGender",
    label: "Gender",
    description: "Show the gender value in personal information.",
  },
  {
    key: "showLocation",
    label: "Location",
    description: "Share the location entered in your profile.",
  },
  {
    key: "showProfession",
    label: "Profession",
    description: "Share your profession or current role.",
  },
  {
    key: "showEmail",
    label: "Email address",
    description: "Make your account email visible on your profile.",
  },
  {
    key: "showPhone",
    label: "Phone number",
    description: "Make your verified number visible on your profile.",
  },
];

export function PrivacyEditor({ settings, userId }: { settings: PlayerSettings; userId: string }) {
  const [value, setValue] = useState(settings);
  const [saved, setSaved] = useState(false);
  const update = useUpdatePlayerSettings(userId);
  const patch = (
    key: keyof PrivacySettings,
    next: boolean | PrivacySettings["profileVisibility"],
  ) => {
    setSaved(false);
    setValue((current) => ({ ...current, privacy: { ...current.privacy, [key]: next } }));
  };
  const save = async () => {
    await update.mutateAsync(value);
    setSaved(true);
  };
  return (
    <section className="settings-form">
      <div className="settings-section-heading">
        <p>Privacy</p>
        <h2>Control your visibility</h2>
        <span>
          Choose who can view the full profile, then decide which personal fields are included.
        </span>
      </div>
      <fieldset className="settings-visibility">
        <legend>Profile visibility</legend>
        {(
          [
            ["public", "Public", "Anyone on Gamerie can view your complete profile."],
            ["friends", "Connections", "Only players who follow you can view the full profile."],
            ["private", "Private", "Only your public identity header remains visible."],
          ] as const
        ).map(([id, label, description]) => (
          <label key={id}>
            <input
              type="radio"
              name="visibility"
              checked={value.privacy.profileVisibility === id}
              onChange={() => patch("profileVisibility", id)}
            />
            <span>
              <strong>{label}</strong>
              <small>{description}</small>
            </span>
          </label>
        ))}
      </fieldset>
      <div className="settings-toggle-list">
        <header>
          <h3>Information sharing</h3>
          <p>All personal fields remain hidden unless you explicitly enable them.</p>
        </header>
        {sharing.map((item) => (
          <label key={item.key}>
            <span>
              <strong>{item.label}</strong>
              <small>{item.description}</small>
            </span>
            <input
              type="checkbox"
              role="switch"
              checked={Boolean(value.privacy[item.key])}
              onChange={(event) => patch(item.key, event.target.checked)}
            />
          </label>
        ))}
      </div>
      {update.isError ? (
        <p className="settings-error" role="alert">
          {getApiErrorMessage(update.error, "Your privacy settings could not be saved.")}
        </p>
      ) : null}
      <footer className="settings-form__footer">
        <span aria-live="polite">{saved ? "Privacy settings saved." : ""}</span>
        <Button disabled={update.isPending} onClick={() => void save()}>
          {update.isPending ? "Saving…" : "Save privacy"}
        </Button>
      </footer>
    </section>
  );
}
