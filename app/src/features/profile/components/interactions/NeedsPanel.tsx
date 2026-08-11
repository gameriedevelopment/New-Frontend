import { Plus, Trash2 } from "lucide-react";
import { useCallback, useState } from "react";
import { Button, SearchSelect } from "../../../../components/ui";
import { getApiErrorMessage } from "../../../../lib/errors";
import { useGameOptions, useUpdatePlayerProfile } from "../../hooks";
import type { PlayerProfile } from "../../types";
import { ProfileDialog } from "./ProfileDialog";

const needTypes = [
  "Looking for Team",
  "Looking for Players",
  "Looking for Coach",
  "Looking for Practice Partner",
  "Looking for Tournament",
];

export function NeedsPanel({ own, profile }: { own: boolean; profile: PlayerProfile }) {
  const active = (profile.needs ?? [])
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => item.active !== false);
  const update = useUpdatePlayerProfile(profile.id);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [confirming, setConfirming] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [form, setForm] = useState({ type: needTypes[0], game: "", description: "" });
  const games = useGameOptions(search, open);
  const onSearch = useCallback((value: string) => setSearch(value), []);
  const normalized = (items: NonNullable<PlayerProfile["needs"]>) =>
    items.map((item) => ({
      type: item.type || "Looking for Players",
      game: item.game || "",
      description: item.description || "",
      active: item.active !== false,
    }));
  const add = async () => {
    await update.mutateAsync({
      needs: [...normalized(profile.needs ?? []), { ...form, active: true }],
    });
    setOpen(false);
    setForm({ type: needTypes[0], game: "", description: "" });
  };
  const remove = async (index: number) => {
    await update.mutateAsync({
      needs: normalized(profile.needs ?? []).filter((_item, itemIndex) => itemIndex !== index),
    });
    setConfirming(null);
  };
  const gameOptions = games.data?.pages.flatMap((page) => page.data) ?? [];
  const visible = expanded ? active : active.slice(0, 3);
  return (
    <section className="profile-needs-panel">
      <header>
        <div>
          <p>Availability</p>
          <h2>Open to opportunities</h2>
        </div>
        {own ? (
          <button type="button" onClick={() => setOpen(true)}>
            <Plus size={14} />
            Add request
          </button>
        ) : null}
      </header>
      {active.length ? (
        <>
          <div>
            {visible.map(({ item: need, index }) => (
              <article key={need.id || `${need.type}-${index}`}>
                <span>{need.type || "Looking for"}</span>
                <h3>{need.game || "Any game"}</h3>
                <p>{need.description}</p>
                {own ? (
                  <button
                    type="button"
                    data-confirm={confirming === index}
                    disabled={update.isPending}
                    onClick={() =>
                      confirming === index ? void remove(index) : setConfirming(index)
                    }
                  >
                    {confirming === index ? (
                      "Confirm remove"
                    ) : (
                      <>
                        <Trash2 size={13} />
                        Remove
                      </>
                    )}
                  </button>
                ) : null}
              </article>
            ))}
          </div>
          {active.length > 3 ? (
            <button
              type="button"
              className="profile-collection-more"
              aria-expanded={expanded}
              onClick={() => setExpanded((value) => !value)}
            >
              {expanded ? "Show fewer requests" : `View all ${active.length} requests`}
            </button>
          ) : null}
        </>
      ) : (
        <p className="profile-panel-empty">
          {own
            ? "Add a focused request when you are looking for a team, player, coach, or competition."
            : "This player has no active requests."}
        </p>
      )}
      {update.isError ? (
        <p className="profile-inline-action-error" role="alert">
          {getApiErrorMessage(update.error, "The request could not be updated.")}
        </p>
      ) : null}
      {open ? (
        <ProfileDialog
          title="Add an opportunity request"
          onClose={() => !update.isPending && setOpen(false)}
        >
          <form
            className="profile-interaction-form"
            onSubmit={(event) => {
              event.preventDefault();
              void add();
            }}
          >
            <label>
              <span>Request type</span>
              <select
                value={form.type}
                onChange={(event) =>
                  setForm((current) => ({ ...current, type: event.target.value }))
                }
              >
                {needTypes.map((type) => (
                  <option key={type}>{type}</option>
                ))}
              </select>
            </label>
            <SearchSelect
              label="Game"
              value={form.game}
              onChange={(game) => setForm((current) => ({ ...current, game }))}
              onSearch={onSearch}
              loading={games.isLoading}
              loadingMore={games.isFetchingNextPage}
              hasMore={games.hasNextPage}
              onLoadMore={() => {
                if (!games.isFetchingNextPage) void games.fetchNextPage();
              }}
              options={gameOptions.map((game) => ({
                value: game.name,
                label: game.name,
                description: game.gameType,
              }))}
              placeholder="Choose a game"
              searchPlaceholder="Search the game catalogue"
            />
            <label>
              <span>Description</span>
              <textarea
                rows={4}
                maxLength={300}
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({ ...current, description: event.target.value }))
                }
                placeholder="Be specific about the role, level, availability, or goal."
              />
              <small>{form.description.length} / 300</small>
            </label>
            {update.isError ? (
              <p className="profile-inline-action-error" role="alert">
                {getApiErrorMessage(update.error, "The request could not be added.")}
              </p>
            ) : null}
            <footer>
              <Button variant="quiet" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={update.isPending || !form.game || !form.description.trim()}
              >
                {update.isPending ? "Adding…" : "Add request"}
              </Button>
            </footer>
          </form>
        </ProfileDialog>
      ) : null}
    </section>
  );
}
