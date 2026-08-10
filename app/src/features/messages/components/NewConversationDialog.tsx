import { Check, Search, Users, UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { SafeImage, SkeletonAvatar, SkeletonText } from "../../../components/ui";
import { getApiErrorMessage } from "../../../lib/errors";
import { useAuthStore } from "../../auth/authStore";
import { sendMessage } from "../api";
import { useCreateConversation, useRecipientSearch, useUserTeams } from "../hooks";
import type { MessageConversation, RecipientTeam, RecipientUser } from "../types";
import { MessageDialog } from "./MessageDialog";

type Selection = { kind: "user"; value: RecipientUser } | { kind: "team"; value: RecipientTeam };

function useDebouncedRecipient(value: string) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => { const timeout = window.setTimeout(() => setDebounced(value.trim()), 280); return () => window.clearTimeout(timeout); }, [value]);
  return debounced;
}

export function NewConversationDialog({ onClose, onCreated }: { onClose: () => void; onCreated: (conversation: MessageConversation, tab: "user" | "team") => void }) {
  const user = useAuthStore((state) => state.user);
  const [type, setType] = useState<"user" | "team">("user");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Selection | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const debounced = useDebouncedRecipient(search);
  const recipients = useRecipientSearch(type, debounced);
  const userTeams = useUserTeams(user?.id);
  const create = useCreateConversation();

  const results = useMemo(() => {
    if (type === "user") return (recipients.data ?? []).filter((recipient): recipient is RecipientUser => "username" in recipient && recipient.id !== user?.id);
    if (debounced.length >= 2) return (recipients.data ?? []).filter((recipient): recipient is RecipientTeam => "name" in recipient);
    return userTeams.data ?? [];
  }, [debounced.length, recipients.data, type, user?.id, userTeams.data]);

  const changeType = (next: "user" | "team") => { setType(next); setSearch(""); setSelected(null); setError(null); };
  const submit = async () => {
    if (!user || !selected) return;
    setError(null);
    setSubmitting(true);
    try {
      let conversation: MessageConversation;
      if (selected.kind === "user") {
        conversation = await create.mutateAsync({ participantIds: [selected.value.id], type: "user" });
      } else {
        const memberTeam = userTeams.data?.find((team) => team.id === selected.value.id);
        const participantIds = memberTeam?.members?.map((member) => member.user?.id || member.userId).filter((id): id is string => Boolean(id)) ?? [user.id];
        conversation = await create.mutateAsync({ participantIds, type: memberTeam ? "team" : "team-inbox", name: selected.value.name, avatar: selected.value.logo ?? undefined, teamId: selected.value.id });
      }
      if (message.trim()) await sendMessage(conversation.id, message.trim());
      onCreated(conversation, selected.kind === "user" ? "user" : "team");
    } catch (reason) {
      setError(getApiErrorMessage(reason, "The conversation could not be opened."));
    } finally {
      setSubmitting(false);
    }
  };

  const busy = submitting;
  const teamSelection = selected?.kind === "team" ? userTeams.data?.find((team) => team.id === selected.value.id) : null;
  const resolvingTeamMembership = type === "team" && userTeams.isLoading;
  const loadingResults = recipients.isFetching || resolvingTeamMembership;

  return <MessageDialog title="New conversation" wide onClose={() => !busy && onClose()}>
    <div className="new-conversation">
      <div className="new-conversation__tabs" role="tablist" aria-label="Recipient type"><button type="button" role="tab" aria-selected={type === "user"} className={type === "user" ? "is-active" : undefined} onClick={() => changeType("user")}><UserRound size={15} />Player</button><button type="button" role="tab" aria-selected={type === "team"} className={type === "team" ? "is-active" : undefined} onClick={() => changeType("team")}><Users size={15} />Team</button></div>
      {!selected ? <>
        <label className="new-conversation__search"><span>{type === "user" ? "Find a player" : "Find a team"}</span><div><Search size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={type === "user" ? "Search by username or name" : "Search teams, or choose one of yours"} autoComplete="off" /></div></label>
        <div className="new-conversation__results" aria-live="polite">
          {loadingResults ? Array.from({ length: 3 }, (_, index) => <div className="recipient-skeleton" key={index}><SkeletonAvatar size={36} /><SkeletonText lines={2} /></div>) : null}
          {!loadingResults && (type === "user" || !userTeams.isError) && results.map((recipient) => {
            const isUser = "username" in recipient;
            const ownTeam = !isUser && userTeams.data?.some((team) => team.id === recipient.id);
            const name = isUser ? recipient.displayName || recipient.username : recipient.name;
            const image = isUser ? recipient.profileImage || recipient.profilePictureUrl : recipient.logo;
            return <button type="button" className="recipient-row" key={recipient.id} onClick={() => setSelected(isUser ? { kind: "user", value: recipient } : { kind: "team", value: recipient })}><span>{image ? <SafeImage src={image} alt="" fallback={isUser ? "/user-profile-fallback.jpg" : "/media-fallback.svg"} /> : name.slice(0, 2).toUpperCase()}</span><span><strong>{name}</strong><small>{isUser ? recipient.gamerTitle || `@${recipient.username}` : ownTeam ? "Your team room" : "Message the team inbox"}</small></span></button>;
          })}
          {!loadingResults && type === "user" && debounced.length < 2 ? <div className="new-conversation__prompt"><UserRound size={18} /><strong>Search Gamerie players</strong><p>Enter at least two characters to find the person you want to message.</p></div> : null}
          {!loadingResults && debounced.length >= 2 && !results.length ? <div className="new-conversation__prompt"><strong>No {type === "user" ? "players" : "teams"} found</strong><p>Check the spelling or try a broader search.</p></div> : null}
          {recipients.isError ? <p className="message-inline-error" role="alert">{getApiErrorMessage(recipients.error, "Recipients could not be searched.")}</p> : null}
          {type === "team" && userTeams.isError ? <p className="message-inline-error" role="alert">Your team memberships could not be verified. Try opening the conversation again.</p> : null}
        </div>
      </> : <div className="new-conversation__selected">
        <p>To</p><div><span>{selected.kind === "user" ? <SafeImage src={selected.value.profileImage || selected.value.profilePictureUrl} alt="" /> : <SafeImage src={selected.value.logo} fallback="/media-fallback.svg" alt="" />}</span><span><strong>{selected.kind === "user" ? selected.value.displayName || selected.value.username : selected.value.name}</strong><small>{selected.kind === "user" ? `@${selected.value.username}` : teamSelection ? "Team room · members included" : "Team inbox · leadership can respond"}</small></span><Check size={16} /></div><button type="button" onClick={() => { setSelected(null); setMessage(""); }}>Choose someone else</button>
        <label>Opening message <span>Optional</span><textarea value={message} maxLength={4000} onChange={(event) => setMessage(event.target.value)} placeholder="Start with a clear message" rows={4} /></label>
      </div>}
      {error ? <p className="message-inline-error" role="alert">{error}</p> : null}
    </div>
    <footer><button type="button" onClick={onClose} disabled={busy}>Cancel</button><button type="button" className="is-primary" disabled={!selected || busy || message.length > 4000} onClick={() => void submit()}>{busy ? "Opening…" : message.trim() ? "Send and open" : "Open conversation"}</button></footer>
  </MessageDialog>;
}
