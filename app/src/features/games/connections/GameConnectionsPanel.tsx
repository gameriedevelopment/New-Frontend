import { AlertCircle, Check, ChevronDown, Link2, RefreshCw, Unlink } from "lucide-react";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useLocation } from "react-router-dom";
import { Button, Skeleton, StatePanel } from "../../../components/ui";
import { getApiErrorMessage } from "../../../lib/errors";
import type { GameConnection, GameProviderId } from "../types";
import { startRedirectConnection } from "./api";
import { useDisconnectProvider, useGameConnections, useProviderMetrics } from "./hooks";
import { GAME_PROVIDERS, type ProviderDefinition } from "./registry";
import { ProviderConnectionDialog } from "./ProviderConnectionDialog";
import "../games.css";

function ProviderCard({
  connection,
  provider,
  returnTo,
  onConnect,
}: {
  connection?: GameConnection;
  provider: ProviderDefinition;
  returnTo: string;
  onConnect: (id: GameProviderId) => void;
}) {
  const [open, setOpen] = useState(Boolean(connection));
  const [confirming, setConfirming] = useState(false);
  const disconnect = useDisconnectProvider();
  const stats = useProviderMetrics(connection, Boolean(connection) && open);
  const connect = () =>
    provider.connectKind === "steam" || provider.connectKind === "lichess"
      ? void startRedirectConnection(
          provider.id as "steam" | "dota-2" | "cs2" | "lichess",
          returnTo,
        )
      : onConnect(provider.id);
  const unlink = async () => {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    try {
      await disconnect.mutateAsync(provider.id);
      setConfirming(false);
      setOpen(false);
    } catch {
      /* shown below */
    }
  };
  return (
    <article className="provider-card" data-connected={Boolean(connection)} data-open={open}>
      <div className="provider-card__top">
        <span
          className="provider-card__mark"
          style={{ "--provider-color": provider.accent } as CSSProperties}
        >
          {provider.initials}
        </span>
        <div className="provider-card__identity">
          <p>{provider.family}</p>
          <h3>{provider.name}</h3>
          <span>{connection ? connection.handle || "Verified account" : provider.description}</span>
        </div>
        {connection ? (
          <button
            type="button"
            className="provider-card__status"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
          >
            <Check size={13} />
            Connected
            <ChevronDown size={13} />
          </button>
        ) : (
          <Button size="small" variant="secondary" onClick={connect}>
            <Link2 size={13} />
            Connect
          </Button>
        )}
      </div>
      {connection && open ? (
        <div className="provider-card__details">
          <div className="provider-card__sync">
            <span>Last verified</span>
            <time>
              {connection.lastSyncedAt
                ? new Date(connection.lastSyncedAt).toLocaleString(undefined, {
                    day: "numeric",
                    month: "short",
                    hour: "numeric",
                    minute: "2-digit",
                  })
                : "Not synced yet"}
            </time>
          </div>
          {stats.isLoading ? (
            <div className="provider-card__metrics">
              {Array.from({ length: 4 }, (_, index) => (
                <Skeleton height={52} key={index} />
              ))}
            </div>
          ) : stats.isError ? (
            <div className="provider-card__unavailable">
              <AlertCircle size={15} />
              <span>
                <strong>Statistics unavailable</strong>
                <small>
                  {getApiErrorMessage(
                    stats.error,
                    "The provider could not return current statistics.",
                  )}
                </small>
              </span>
              <button type="button" onClick={() => stats.refetch()}>
                <RefreshCw size={13} />
                Retry
              </button>
            </div>
          ) : stats.data?.length ? (
            <dl className="provider-card__metrics">
              {stats.data.map((metric) => (
                <div key={metric.label}>
                  <dt>{metric.label}</dt>
                  <dd>{metric.value}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <div className="provider-card__unavailable">
              <span>
                <strong>Connected identity</strong>
                <small>This provider has not exposed summary statistics for the account yet.</small>
              </span>
            </div>
          )}
          <div className="provider-card__footer">
            <span>Account ID · {connection.providerAccountId.slice(0, 18)}</span>
            <button
              type="button"
              data-confirm={confirming}
              disabled={disconnect.isPending}
              onClick={() => void unlink()}
            >
              <Unlink size={13} />
              {disconnect.isPending
                ? "Disconnecting…"
                : confirming
                  ? "Confirm disconnect"
                  : "Disconnect"}
            </button>
          </div>
          {disconnect.isError ? (
            <p role="alert">
              {getApiErrorMessage(disconnect.error, `${provider.name} could not be disconnected.`)}
            </p>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

export function GameConnectionsPanel({ username }: { username: string }) {
  const location = useLocation();
  const query = useGameConnections();
  const [dialog, setDialog] = useState<GameProviderId | null>(null);
  const [showAvailable, setShowAvailable] = useState(false);
  const [confirmation, setConfirmation] = useState(() =>
    typeof location.state?.connectionStatus === "string" ? location.state.connectionStatus : "",
  );
  const connections = query.data ?? [];
  const connectedProviders = useMemo(
    () =>
      GAME_PROVIDERS.filter((provider) =>
        connections.some((item) => item.provider === provider.id),
      ),
    [connections],
  );
  const availableProviders = useMemo(
    () =>
      GAME_PROVIDERS.filter(
        (provider) => !connections.some((item) => item.provider === provider.id),
      ),
    [connections],
  );
  const returnTo = `/profile/${username}?tab=games`;
  useEffect(() => {
    if (!confirmation) return;
    const timer = window.setTimeout(() => setConfirmation(""), 3200);
    return () => window.clearTimeout(timer);
  }, [confirmation]);
  return (
    <section className="game-connections">
      <header>
        <div>
          <p>Verified accounts</p>
          <h2>Game connections</h2>
          <span>
            Link the accounts behind your play. Only verified provider data is presented as
            connected.
          </span>
        </div>
        {!query.isLoading ? (
          <small>
            {connections.length} of {GAME_PROVIDERS.length} connected
          </small>
        ) : null}
      </header>
      {confirmation ? (
        <p className="game-connections__confirmation" role="status">
          <Check size={13} />
          {confirmation}
        </p>
      ) : null}
      {query.isLoading ? (
        <div className="provider-grid">
          {Array.from({ length: 2 }, (_, index) => (
            <Skeleton height={104} key={index} />
          ))}
        </div>
      ) : query.isError ? (
        <StatePanel
          tone="error"
          title="Game connections could not load"
          description={getApiErrorMessage(
            query.error,
            "Gamerie could not retrieve your connected accounts.",
          )}
          action={
            <Button variant="secondary" onClick={() => query.refetch()}>
              Try again
            </Button>
          }
        />
      ) : (
        <>
          <div className="provider-grid">
            {connectedProviders.map((provider) => (
              <ProviderCard
                key={provider.id}
                provider={provider}
                connection={connections.find((item) => item.provider === provider.id)}
                returnTo={returnTo}
                onConnect={setDialog}
              />
            ))}
          </div>
          {!connections.length ? (
            <p className="game-connections__empty">
              No external game accounts are connected yet. Your manually added games remain part of
              your profile.
            </p>
          ) : null}
          {availableProviders.length ? (
            <div className="game-connections__available">
              <button
                type="button"
                aria-expanded={showAvailable}
                onClick={() => setShowAvailable((value) => !value)}
              >
                <span>
                  {showAvailable ? "Hide available connections" : "Connect another game account"}
                  <small>{availableProviders.length} supported providers</small>
                </span>
                <ChevronDown size={16} />
              </button>
              {showAvailable ? (
                <div className="provider-grid">
                  {availableProviders.map((provider) => (
                    <ProviderCard
                      key={provider.id}
                      provider={provider}
                      returnTo={returnTo}
                      onConnect={setDialog}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </>
      )}
      {dialog ? (
        <ProviderConnectionDialog providerId={dialog} onClose={() => setDialog(null)} />
      ) : null}
    </section>
  );
}
