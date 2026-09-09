import { CheckCircle2, XCircle } from "lucide-react";
import type { ProfileCompletion, ProfileCompletionField } from "../features/users/types";
import "./ProfileCompletionBadge.css";

const FIELD_LABELS: Record<ProfileCompletionField, string> = {
  avatar: "Profile image",
  cover: "Cover image",
  bio: "Bio",
  title: "Player title",
  game: "Game added",
  skill: "Skill added",
  platform: "Platform selected",
  social: "Social link",
};

const ALL_FIELDS: ProfileCompletionField[] = [
  "avatar",
  "bio",
  "title",
  "game",
  "skill",
  "platform",
  "social",
  "cover",
];

export function ProfileCompletionBadge({
  completion,
  showScore = true,
}: {
  completion?: ProfileCompletion;
  showScore?: boolean;
}) {
  if (!completion) return null;
  return (
    <span
      className="profile-completion-badge"
      data-complete={completion.complete ? "true" : "false"}
      title={
        completion.complete
          ? "Profile complete"
          : `Incomplete — missing ${completion.missing.map((field) => FIELD_LABELS[field]).join(", ")}`
      }
    >
      {completion.complete ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
      <span>{completion.complete ? "Complete" : "Incomplete"}</span>
      {showScore ? <small>{completion.score}%</small> : null}
    </span>
  );
}

export function ProfileCompletionBreakdown({ completion }: { completion?: ProfileCompletion }) {
  if (!completion) return null;
  const missing = new Set(completion.missing);
  return (
    <div className="profile-completion-breakdown">
      <div className="profile-completion-breakdown__header">
        <ProfileCompletionBadge completion={completion} />
        <span>
          {completion.completed} of {completion.total} requirements met
        </span>
      </div>
      <ul>
        {ALL_FIELDS.map((field) => {
          const done = !missing.has(field);
          return (
            <li key={field} data-done={done ? "true" : "false"}>
              {done ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
              {FIELD_LABELS[field]}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
