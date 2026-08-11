import {
  Check,
  Copy,
  Flag,
  LogOut,
  Mail,
  MoreHorizontal,
  Pencil,
  Swords,
  UserMinus,
  UserPlus,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../../components/ui";
import { getApiErrorMessage } from "../../../lib/errors";
import { useAuthStore } from "../../auth/authStore";
import { useCreateConversation } from "../../messages/hooks";
import {
  useCommunityFollow,
  useCommunityJoin,
  useCommunityLeave,
  useCommunityReport,
} from "../hooks";
import type { HubSummary, TeamSummary } from "../types";
import { CommunityDialog } from "./CommunityDialog";

export function CommunityActions({
  kind,
  item,
  slug,
}: {
  kind: "team" | "hub";
  item: TeamSummary | HubSummary;
  slug: string;
}) {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const relation = item.viewerRelationship;
  const [dialog, setDialog] = useState<"join" | "report" | "leave" | null>(null);
  const [message, setMessage] = useState("");
  const [reportType, setReportType] = useState("spam");
  const [reason, setReason] = useState("");
  const [share, setShare] = useState<"copied" | "error" | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const follow = useCommunityFollow(kind, slug, item.id, Boolean(relation?.isFollowing));
  const join = useCommunityJoin(kind, slug, item.id);
  const leave = useCommunityLeave(kind, slug, item.id);
  const report = useCommunityReport(kind, item.id, item.ownerId || item.id);
  const conversation = useCreateConversation();

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const primaryLabel = relation?.isMember
    ? "Message team"
    : relation?.hasPendingRequest
      ? "Request pending"
      : kind === "hub" &&
          (item as HubSummary).joinPolicy === "open" &&
          (item as HubSummary).visibility !== "private"
        ? "Join hub"
        : "Request to join";

  const openTeamInbox = async () => {
    if (kind !== "team" || !user) return;
    try {
      const result = await conversation.mutateAsync({
        participantIds: [user.id],
        type: "team-inbox",
        teamId: item.id,
        name: item.name,
        avatar: item.logo,
      });
      navigate(`/messages?conversation=${result.id}&tab=team`);
    } catch {
      /* The mutation error is rendered beside the controls. */
    }
  };

  const runPrimary = async () => {
    if (relation?.isMember) {
      await openTeamInbox();
      return;
    }
    if (relation?.hasPendingRequest) return;
    const hub = item as HubSummary;
    if (kind === "hub" && hub.joinPolicy === "open" && hub.visibility !== "private") {
      try {
        await join.mutateAsync("");
      } catch {
        /* Rendered beside the controls. */
      }
    } else setDialog("join");
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/${kind}s/${encodeURIComponent(slug)}`,
      );
      setShare("copied");
    } catch {
      setShare("error");
    }
    timer.current = window.setTimeout(() => setShare(null), 2200);
  };
  const submitJoin = async () => {
    try {
      await join.mutateAsync(message.trim());
      setDialog(null);
      setMessage("");
    } catch {}
  };
  const submitReport = async () => {
    try {
      await report.mutateAsync({ type: reportType, reason: reason.trim() });
      setDialog(null);
      setReason("");
    } catch {}
  };
  const confirmLeave = async () => {
    try {
      await leave.mutateAsync();
      setDialog(null);
    } catch {}
  };
  const pending = follow.isPending || join.isPending || conversation.isPending;
  const actionError =
    follow.error || conversation.error || (join.isError && dialog !== "join" ? join.error : null);

  return (
    <>
      <div className="community-actions">
        {!(relation?.isMember && kind === "hub") ? (
          <Button
            size="small"
            disabled={pending || Boolean(relation?.hasPendingRequest)}
            onClick={runPrimary}
          >
            {relation?.isMember ? (
              <Mail size={14} />
            ) : relation?.hasPendingRequest ? (
              <Check size={14} />
            ) : (
              <UserPlus size={14} />
            )}
            {conversation.isPending ? "Opening…" : join.isPending ? "Updating…" : primaryLabel}
          </Button>
        ) : null}
        {!relation?.isOwner ? (
          <Button
            size="small"
            variant="secondary"
            disabled={follow.isPending}
            onClick={() => follow.mutate()}
          >
            {relation?.isFollowing ? <UserMinus size={14} /> : <UserPlus size={14} />}
            {follow.isPending ? "Updating…" : relation?.isFollowing ? "Following" : "Follow"}
          </Button>
        ) : null}
        <details>
          <summary aria-label="More community actions">
            <MoreHorizontal size={17} />
          </summary>
          <div role="menu">
            {relation?.isOwner ? (
              <button
                type="button"
                role="menuitem"
                onClick={() => navigate(`/${kind}s/${encodeURIComponent(slug)}/edit`)}
              >
                <Pencil size={14} />
                Edit {kind}
              </button>
            ) : null}
            {kind === "team" && !relation?.isOwner ? (
              <button
                type="button"
                role="menuitem"
                onClick={() =>
                  navigate(
                    `/challenges?compose=team&target=${encodeURIComponent(item.id)}&targetName=${encodeURIComponent(item.name)}`,
                  )
                }
              >
                <Swords size={14} />
                Challenge team
              </button>
            ) : null}
            <button type="button" role="menuitem" onClick={() => void copyLink()}>
              <Copy size={14} />
              {share === "copied" ? "Copied" : share === "error" ? "Copy failed" : "Copy link"}
            </button>
            {kind === "team" && !relation?.isMember ? (
              <button type="button" role="menuitem" onClick={() => void openTeamInbox()}>
                <Mail size={14} />
                Message team
              </button>
            ) : null}
            {relation?.isMember && !relation.isOwner ? (
              <button type="button" role="menuitem" onClick={() => setDialog("leave")}>
                <LogOut size={14} />
                Leave {kind}
              </button>
            ) : null}
            {!relation?.isMember ? (
              <button type="button" role="menuitem" onClick={() => setDialog("report")}>
                <Flag size={14} />
                Report {kind}
              </button>
            ) : null}
          </div>
        </details>
        {actionError ? (
          <span className="community-actions__status" role="alert">
            {getApiErrorMessage(actionError, "That action could not be completed.")}
          </span>
        ) : share === "copied" ? (
          <span className="community-actions__status" role="status">
            Link copied
          </span>
        ) : null}
      </div>
      {dialog === "join" ? (
        <CommunityDialog title={`Request to join ${item.name}`} onClose={() => setDialog(null)}>
          <div className="community-dialog__body">
            <p>
              Add a short note for the {kind === "team" ? "team managers" : "hub admins"}. This is
              optional.
            </p>
            <label>
              <span>Message</span>
              <textarea
                maxLength={300}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Introduce yourself and why you would like to join."
              />
              <small>{message.length} / 300</small>
            </label>
            {join.isError ? (
              <p className="community-action-error" role="alert">
                {getApiErrorMessage(join.error, "Your request could not be sent.")}
              </p>
            ) : null}
          </div>
          <footer>
            <Button variant="quiet" onClick={() => setDialog(null)}>
              Cancel
            </Button>
            <Button disabled={join.isPending} onClick={submitJoin}>
              {join.isPending ? "Sending…" : "Send request"}
            </Button>
          </footer>
        </CommunityDialog>
      ) : null}
      {dialog === "report" ? (
        <CommunityDialog title={`Report ${item.name}`} onClose={() => setDialog(null)}>
          <div className="community-dialog__body">
            <p>
              Reports are reviewed by Gamerie. Give enough detail for the moderation team to
              understand the issue.
            </p>
            <label>
              <span>Reason</span>
              <select value={reportType} onChange={(event) => setReportType(event.target.value)}>
                <option value="spam">Spam</option>
                <option value="harassment">Harassment</option>
                <option value="inappropriate">Inappropriate content</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label>
              <span>Details</span>
              <textarea
                maxLength={500}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Explain what happened."
              />
              <small>{reason.length} / 500 · Minimum 10 characters</small>
            </label>
            {report.isError ? (
              <p className="community-action-error" role="alert">
                {getApiErrorMessage(report.error, "The report could not be submitted.")}
              </p>
            ) : null}
          </div>
          <footer>
            <Button variant="quiet" onClick={() => setDialog(null)}>
              Cancel
            </Button>
            <Button disabled={reason.trim().length < 10 || report.isPending} onClick={submitReport}>
              {report.isPending ? "Submitting…" : "Submit report"}
            </Button>
          </footer>
        </CommunityDialog>
      ) : null}
      {dialog === "leave" ? (
        <CommunityDialog title={`Leave ${item.name}?`} onClose={() => setDialog(null)}>
          <div className="community-dialog__body">
            <p>
              You will lose member access. You can request to join again later if the community
              accepts requests.
            </p>
            {leave.isError ? (
              <p className="community-action-error" role="alert">
                {getApiErrorMessage(leave.error, `You could not leave this ${kind}.`)}
              </p>
            ) : null}
          </div>
          <footer>
            <Button variant="quiet" onClick={() => setDialog(null)}>
              Cancel
            </Button>
            <Button disabled={leave.isPending} onClick={confirmLeave}>
              {leave.isPending ? "Leaving…" : `Leave ${kind}`}
            </Button>
          </footer>
        </CommunityDialog>
      ) : null}
    </>
  );
}
