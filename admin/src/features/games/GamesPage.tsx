import { useEffect, useState } from "react";
import { AdminAvatar } from "../../components/AdminAvatar";
import { DetailDrawer, DetailList } from "../../components/DetailDrawer";
import { DirectoryView } from "../../components/DirectoryView";
import { getErrorMessage } from "../../lib/errors";
import { DeleteGameDialog } from "./DeleteGameDialog";
import { GameEditorDialog } from "./GameEditorDialog";
import { useAdminGames, useDeleteAdminGame, useSaveAdminGame } from "./hooks";
import type { AdminGameInput, AdminGameRecord } from "./types";
import "./games.css";
import { PlayerAppLink } from "../../components/PlayerAppLink";

export function GamesPage() {
  const [search, setSearch] = useState("");
  const [term, setTerm] = useState("");
  const [platform, setPlatform] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<AdminGameRecord | null>(null);
  const [editing, setEditing] = useState<AdminGameRecord | null | undefined>(undefined);
  const [deleting, setDeleting] = useState<AdminGameRecord | null>(null);
  const query = useAdminGames({
    page,
    limit: 20,
    search: term || undefined,
    platform: platform || undefined,
  });
  const save = useSaveAdminGame();
  const remove = useDeleteAdminGame();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setTerm(search.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const closeEditor = () => {
    if (save.isPending) return;
    save.reset();
    setEditing(undefined);
  };

  const saveGame = (input: AdminGameInput) => {
    save.mutate(
      { id: editing?.id, input },
      {
        onSuccess: () => {
          setSelected(null);
          setEditing(undefined);
        },
      },
    );
  };

  return (
    <>
      <DirectoryView
        eyebrow="Catalogue"
        title="Games"
        description="Maintain the titles that anchor discovery, player identity, teams, achievements, and competition records."
        search={search}
        searchPlaceholder="Search title, studio, or type"
        onSearch={setSearch}
        filters={
          <select
            aria-label="Platform"
            value={platform}
            onChange={(event) => {
              setPlatform(event.target.value);
              setPage(1);
            }}
          >
            <option value="">All platforms</option>
            <option value="PC">PC</option>
            <option value="PS5">PS5</option>
            <option value="XBOX">Xbox</option>
            <option value="Switch">Switch</option>
            <option value="Mobile">Mobile</option>
          </select>
        }
        action={
          <button
            className="admin-primary-button"
            onClick={() => {
              save.reset();
              setEditing(null);
            }}
          >
            Add game
          </button>
        }
        loading={query.isLoading}
        error={
          query.isError ? getErrorMessage(query.error, "Games could not be loaded.") : undefined
        }
        empty={!query.isLoading && !query.data?.data.length}
        count={query.data?.total}
        page={page}
        totalPages={query.data?.totalPages ?? 0}
        onPage={setPage}
        onRetry={() => void query.refetch()}
      >
        {query.data?.data.map((record) => (
          <article
            className="admin-directory-row"
            key={record.id}
            role="button"
            tabIndex={0}
            onClick={() => setSelected(record)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setSelected(record);
              }
            }}
          >
            <div className="admin-directory-identity">
              <AdminAvatar name={record.name} src={record.wallPhoto} shape="rounded" />
              <div>
                <strong>{record.name}</strong>
                <span>{record.company || "Studio not set"}</span>
              </div>
            </div>
            <div className="admin-directory-meta">
              <span>Catalogue context</span>
              <strong>
                {record.gameType} · {record.platforms?.length ?? 0} platforms
              </strong>
            </div>
            <div className="admin-directory-meta">
              <span>Participation</span>
              <strong>
                {record.usersCount} players · {record.teamsCount} teams
              </strong>
            </div>
            <button
              className="admin-row-action"
              onClick={(event) => {
                event.stopPropagation();
                save.reset();
                setEditing(record);
              }}
            >
              Edit
            </button>
          </article>
        ))}
      </DirectoryView>
      <DetailDrawer
        open={Boolean(selected)}
        eyebrow="Game record"
        title={selected?.name ?? "Game details"}
        subtitle={selected?.description}
        onClose={() => setSelected(null)}
        actions={
          selected ? (
            <>
              <PlayerAppLink segments={["games", selected.id]}>Open game</PlayerAppLink>
              <button
                className="admin-secondary-button"
                onClick={() => {
                  setDeleting(selected);
                  remove.reset();
                }}
              >
                Remove
              </button>
              <button
                className="admin-primary-button"
                onClick={() => {
                  save.reset();
                  setEditing(selected);
                }}
              >
                Edit game
              </button>
            </>
          ) : null
        }
      >
        {selected ? (
          <>
            <div className="admin-game-cover">
              <img
                src={selected.wallPhoto || ""}
                alt=""
                onError={(event) => {
                  event.currentTarget.hidden = true;
                }}
              />
            </div>
            <DetailList
              items={[
                { label: "Studio", value: selected.company },
                { label: "Type", value: selected.gameType },
                { label: "Integration", value: selected.integrationKey || "Not connected" },
                { label: "Platforms", value: selected.platforms?.join(", ") },
                { label: "Modes", value: selected.gameModes?.join(", ") },
                { label: "Required skills", value: selected.requiredSkills?.join(", ") },
                { label: "Players", value: selected.usersCount },
                { label: "Teams", value: selected.teamsCount },
                {
                  label: "Official website",
                  value: selected.officialWebsite ? (
                    <a href={selected.officialWebsite} target="_blank" rel="noreferrer">
                      Open website
                    </a>
                  ) : null,
                },
                { label: "Updated", value: new Date(selected.updatedAt).toLocaleString() },
              ]}
            />
          </>
        ) : null}
      </DetailDrawer>
      <GameEditorDialog
        open={editing !== undefined}
        game={editing}
        busy={save.isPending}
        error={save.error}
        onClose={closeEditor}
        onSave={saveGame}
      />
      <DeleteGameDialog
        open={Boolean(deleting)}
        gameName={deleting?.name ?? "this game"}
        busy={remove.isPending}
        error={
          remove.isError
            ? getErrorMessage(remove.error, "The game could not be removed.")
            : undefined
        }
        onClose={() => {
          if (!remove.isPending) setDeleting(null);
        }}
        onConfirm={(reason) => {
          if (!deleting) return;
          remove.mutate(
            { id: deleting.id, reason },
            {
              onSuccess: () => {
                setDeleting(null);
                setSelected(null);
              },
            },
          );
        }}
      />
    </>
  );
}
