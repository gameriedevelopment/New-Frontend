import { Check, Clock3, UserRound, X } from "lucide-react";
import { useMemo } from "react";
import { Button, SafeImage, SkeletonText, StatePanel } from "../../../components/ui";
import { getApiErrorMessage } from "../../../lib/errors";
import {
  useCommunityInvites,
  useHubMembershipRequest,
  useHubRequests,
  useRespondHubRequest,
  useRespondInvite,
} from "../hooks";
import type { HubRequestSummary, HubSummary } from "../types";
import { CommunityDialog } from "./CommunityDialog";

export type HubMembershipAction = "hub-invite" | "hub-join-request";

export function HubMembershipActionDialog({
  action,
  actorId,
  hub,
  requestId,
  slug,
  onClose,
}: {
  action: HubMembershipAction;
  actorId?: string;
  hub: HubSummary;
  requestId?: string;
  slug: string;
  onClose: () => void;
}) {
  const isInvite = action === "hub-invite";
  const exact = useHubMembershipRequest(requestId);
  const invites = useCommunityInvites("hubs", isInvite && !requestId);
  const requests = useHubRequests(
    hub.id,
    !isInvite && !requestId && Boolean(hub.viewerRelationship?.canManage),
  );
  const inviteResponse = useRespondInvite("hub");
  const requestResponse = useRespondHubRequest(hub.id, slug);
  const fallback = useMemo<HubRequestSummary | undefined>(() => {
    if (requestId) return undefined;
    if (isInvite) return invites.data?.find((item) => item.hub?.id === hub.id);
    return requests.data?.find((item) => !actorId || item.user?.id === actorId);
  }, [actorId, hub.id, invites.data, isInvite, requestId, requests.data]);
  const request = exact.data ?? fallback;
  const query = requestId ? exact : isInvite ? invites : requests;
  const mutation = isInvite ? inviteResponse : requestResponse;
  const pending = request?.status === undefined || request.status === "pending";
  const person = request?.user;

  const respond = (accept: boolean) => {
    if (!request) return;
    const options = { onSuccess: onClose };
    if (isInvite) inviteResponse.mutate({ id: request.id, accept }, options);
    else requestResponse.mutate({ requestId: request.id, accept }, options);
  };

  return (
    <CommunityDialog
      title={isInvite ? `Invitation to ${hub.name}` : `Join request for ${hub.name}`}
      onClose={() => !mutation.isPending && onClose()}
    >
      <div className="hub-membership-action">
        {query.isLoading ? <SkeletonText lines={5} /> : null}
        {query.isError ? (
          <StatePanel
            tone="error"
            title="This request could not be loaded"
            description={getApiErrorMessage(query.error, "It may no longer be available.")}
            action={<Button onClick={() => query.refetch()}>Try again</Button>}
          />
        ) : null}
        {!query.isLoading && !query.isError && !request ? (
          <StatePanel
            title="This request is no longer pending"
            description="It may already have been accepted, declined, or cancelled."
          />
        ) : null}
        {request ? (
          <>
            <div className="hub-membership-action__identity">
              <SafeImage
                src={isInvite ? hub.logo : person?.profileImage}
                fallback="/avatar-fallback.svg"
                alt=""
              />
              <div>
                <span>{isInvite ? "Hub invitation" : "Requesting player"}</span>
                <strong>
                  {isInvite
                    ? hub.name
                    : person?.displayName || person?.username || "Gamerie player"}
                </strong>
                <small>
                  {pending ? (
                    <>
                      <Clock3 size={12} /> Pending response
                    </>
                  ) : (
                    <>
                      <UserRound size={12} /> {request.status}
                    </>
                  )}
                </small>
              </div>
            </div>
            {request.message ? (
              <p className="hub-membership-action__message">{request.message}</p>
            ) : null}
            {mutation.isError ? (
              <p className="community-action-error" role="alert">
                {getApiErrorMessage(mutation.error, "This request could not be updated.")}
              </p>
            ) : null}
            {pending ? (
              <footer className="hub-membership-action__actions">
                <Button
                  variant="secondary"
                  disabled={mutation.isPending}
                  onClick={() => respond(false)}
                >
                  <X size={14} /> {isInvite ? "Decline" : "Reject"}
                </Button>
                <Button disabled={mutation.isPending} onClick={() => respond(true)}>
                  <Check size={14} /> {mutation.isPending ? "Updating…" : "Accept"}
                </Button>
              </footer>
            ) : (
              <footer className="hub-membership-action__actions">
                <Button variant="secondary" onClick={onClose}>
                  Close
                </Button>
              </footer>
            )}
          </>
        ) : null}
      </div>
    </CommunityDialog>
  );
}
