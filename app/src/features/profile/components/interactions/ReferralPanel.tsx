import { Check, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { SafeImage, SkeletonAvatar, SkeletonText } from "../../../../components/ui";
import { useMyReferrals } from "../../hooks";

type CopyStatus = "idle" | "copying" | "copied" | "error";

async function copyInviteLink(value: string) {
  if (window.isSecureContext && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      return;
    } catch {
      // Some browsers expose Clipboard API but deny it. Continue with the DOM fallback.
    }
  }

  const temporary = document.createElement("textarea");
  const previousFocus =
    document.activeElement instanceof HTMLElement ? document.activeElement : null;
  temporary.value = value;
  temporary.setAttribute("readonly", "");
  temporary.setAttribute("aria-hidden", "true");
  Object.assign(temporary.style, {
    position: "fixed",
    inset: "0 auto auto -9999px",
    opacity: "0",
    pointerEvents: "none",
  });
  document.body.appendChild(temporary);
  temporary.focus({ preventScroll: true });
  temporary.select();
  temporary.setSelectionRange(0, value.length);

  try {
    if (!document.execCommand("copy")) throw new Error("Copy command was unavailable");
  } finally {
    temporary.remove();
    previousFocus?.focus({ preventScroll: true });
  }
}

export function ReferralPanel() {
  const query = useMyReferrals(true);
  const [copyStatus, setCopyStatus] = useState<CopyStatus>("idle");
  const [copyAttempt, setCopyAttempt] = useState(0);
  const copyTimer = useRef<number | null>(null);
  const load = useRef<HTMLDivElement>(null);
  const first = query.data?.pages[0];
  const referralCode = first?.referralCode?.trim() || "";
  const entries = query.data?.pages.flatMap((page) => page.referrals) ?? [];
  useEffect(() => {
    const node = load.current;
    if (!node || !query.hasNextPage) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !query.isFetchingNextPage) void query.fetchNextPage();
      },
      { rootMargin: "160px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [query.fetchNextPage, query.hasNextPage, query.isFetchingNextPage]);
  useEffect(
    () => () => {
      if (copyTimer.current) window.clearTimeout(copyTimer.current);
    },
    [],
  );
  const copy = async () => {
    if (!referralCode) {
      setCopyStatus("copying");
      const result = await query.refetch();
      const refreshedCode = result.data?.pages[0]?.referralCode?.trim();
      setCopyStatus(refreshedCode ? "idle" : "error");
      return;
    }
    const inviteUrl = `${window.location.origin}/register?ref=${referralCode}`;
    if (copyTimer.current) {
      window.clearTimeout(copyTimer.current);
      copyTimer.current = null;
    }
    setCopyStatus("copying");
    try {
      await copyInviteLink(inviteUrl);
      setCopyStatus("copied");
      setCopyAttempt((attempt) => attempt + 1);
      copyTimer.current = window.setTimeout(() => setCopyStatus("idle"), 2200);
    } catch {
      setCopyStatus("error");
    }
  };
  const copied = copyStatus === "copied";
  return (
    <section className="profile-referrals">
      <header>
        <div>
          <p>Invite network</p>
          <h2>Your referrals</h2>
        </div>
        {first ? <strong>{first.totalReferrals.toLocaleString()} joined</strong> : null}
      </header>
      {query.isLoading ? (
        <div className="profile-referrals__skeleton">
          <SkeletonText lines={2} />
          <SkeletonAvatar size={36} />
        </div>
      ) : null}
      {query.isError ? (
        <div className="profile-panel-state">
          <strong>Referral details could not load</strong>
          <button type="button" onClick={() => query.refetch()}>
            Try again
          </button>
        </div>
      ) : null}
      {first ? (
        <>
          <div className="profile-referral-code">
            <div>
              <span>Referral code</span>
              <code>{referralCode || "Not generated yet"}</code>
            </div>
            <button
              key={copied ? copyAttempt : "idle"}
              type="button"
              data-status={copyStatus}
              disabled={copyStatus === "copying"}
              onClick={() => void copy()}
            >
              <span aria-hidden="true">{copied ? <Check size={15} /> : <Copy size={15} />}</span>
              <span>
                {copyStatus === "copying"
                  ? referralCode
                    ? "Copying…"
                    : "Preparing…"
                  : copied
                    ? "Copied"
                    : referralCode
                      ? "Copy invite link"
                      : "Create invite link"}
              </span>
            </button>
          </div>
          <p
            className="profile-copy-status"
            data-status={copyStatus}
            role="status"
            aria-live="polite"
          >
            {copied
              ? "Invite link copied to your clipboard."
              : copyStatus === "error"
                ? referralCode
                  ? "The invite link could not be copied. Check your browser permission and try again."
                  : "Your invite code is unavailable. Restart the updated backend, then try again."
                : ""}
          </p>
          {entries.length ? (
            <div className="profile-referral-list">
              {entries.map((entry) => (
                <Link key={entry.userId} to={`/profile/${entry.username}`}>
                  <SafeImage src={entry.profileImage} alt="" />
                  <span>
                    <strong>{entry.username}</strong>
                    <small>
                      Joined{" "}
                      {new Date(entry.joinedAt).toLocaleDateString(undefined, {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </small>
                  </span>
                  {entry.rewardPoints ? <b>+{entry.rewardPoints}</b> : null}
                </Link>
              ))}
              <div ref={load}>
                {query.isFetchingNextPage ? (
                  "Loading more…"
                ) : query.hasNextPage ? (
                  <button type="button" onClick={() => query.fetchNextPage()}>
                    Load more referrals
                  </button>
                ) : entries.length ? (
                  "All referrals shown"
                ) : null}
              </div>
            </div>
          ) : (
            <p className="profile-panel-empty">
              Your invite link is ready. Referred players will appear here after they join.
            </p>
          )}
        </>
      ) : null}
    </section>
  );
}
