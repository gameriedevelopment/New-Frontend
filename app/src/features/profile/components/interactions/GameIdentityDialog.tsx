import { useCallback, useState } from "react";
import { Button, SearchSelect } from "../../../../components/ui";
import { getApiErrorMessage } from "../../../../lib/errors";
import { useGameOptions, useUpdatePlayerProfile } from "../../hooks";
import type { PlayerProfile, ProfileGame } from "../../types";
import { ProfileDialog } from "./ProfileDialog";

const platforms = ["PC", "XBOX", "PS5", "Switch", "Mobile"];
const levels = ["Beginner", "Intermediate", "Advanced", "Expert", "Pro"];

function existingGamePayload(game: ProfileGame) {
  return {
    id: game.id,
    gameId: game.gameId || game.game?.id,
    name: game.name || game.game?.name,
    platform: game.platform || game.platforms?.[0],
    platforms: game.platforms?.length ? game.platforms : game.platform ? [game.platform] : [],
    skillLevel: game.skillLevel,
    rank: game.rankData?.rank || game.rank,
    nickname: game.nickname,
    gameUsername: game.gameUsername,
  };
}

export function GameIdentityDialog({ game, onClose, profile }: { game?: ProfileGame; onClose: () => void; profile: PlayerProfile }) {
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ gameId: game?.gameId || game?.game?.id || "", gameName: game?.name || game?.game?.name || "", gameUsername: game?.gameUsername || "", platform: game?.platform || game?.platforms?.[0] || "", skillLevel: game?.skillLevel || "", rank: game?.rankData?.rank || game?.rank || "" });
  const catalogue = useGameOptions(search, !game);
  const update = useUpdatePlayerProfile(profile.id);
  const onSearch = useCallback((value: string) => setSearch(value), []);
  const options = catalogue.data?.pages.flatMap((page) => page.data).filter((game) => !(profile.gamesPlayed ?? profile.games ?? []).some((saved) => String(saved.gameId || saved.game?.id) === String(game.id))) ?? [];
  const submit = async () => {
    const existing = (profile.gamesPlayed?.length ? profile.gamesPlayed : profile.games ?? []).map(existingGamePayload);
    const next = { id: game?.id, gameId: form.gameId, name: form.gameName, gameUsername: form.gameUsername.trim(), platform: form.platform, platforms: [form.platform], skillLevel: form.skillLevel, rank: form.rank.trim() || undefined };
    const isEditedGame = (item: ReturnType<typeof existingGamePayload>) => item.id && game?.id
      ? item.id === game.id
      : String(item.gameId) === String(form.gameId);
    await update.mutateAsync({ gamesPlayed: game ? existing.map((item) => isEditedGame(item) ? next : item) : [...existing, next] });
    onClose();
  };
  return <ProfileDialog title={game ? "Edit game identity" : "Add a game"} onClose={() => !update.isPending && onClose()}><form className="profile-interaction-form" onSubmit={(event) => { event.preventDefault(); void submit(); }}>
    {game ? <div className="profile-game-selection"><span>Game</span><strong>{form.gameName || "Connected game"}</strong></div> : <SearchSelect label="Game" value={form.gameId} onChange={(gameId) => { const selected = options.find((item) => item.id === gameId); setForm((current) => ({ ...current, gameId, gameName: selected?.name || "" })); }} onSearch={onSearch} loading={catalogue.isLoading} loadingMore={catalogue.isFetchingNextPage} hasMore={catalogue.hasNextPage} onLoadMore={() => { if (!catalogue.isFetchingNextPage) void catalogue.fetchNextPage(); }} options={options.map((item) => ({ value: item.id, label: item.name, description: item.gameType }))} placeholder="Choose a game" searchPlaceholder="Search the game catalogue" />}
    <label><span>In-game username or player tag</span><input value={form.gameUsername} maxLength={80} autoComplete="off" onChange={(event) => setForm((current) => ({ ...current, gameUsername: event.target.value }))} placeholder="Your identity in this game" /></label>
    <div className="profile-interaction-form__grid"><label><span>Primary platform</span><select value={form.platform} onChange={(event) => setForm((current) => ({ ...current, platform: event.target.value }))}><option value="">Choose platform</option>{platforms.map((platform) => <option key={platform}>{platform}</option>)}</select></label><label><span>Skill level</span><select value={form.skillLevel} onChange={(event) => setForm((current) => ({ ...current, skillLevel: event.target.value }))}><option value="">Choose level</option>{levels.map((level) => <option key={level}>{level}</option>)}</select></label></div>
    <label><span>Current rank <small>Optional</small></span><input value={form.rank} maxLength={80} onChange={(event) => setForm((current) => ({ ...current, rank: event.target.value }))} placeholder="e.g. Diamond II" /></label>
    {update.isError ? <p className="profile-inline-action-error" role="alert">{getApiErrorMessage(update.error, "This game could not be added to your profile.")}</p> : null}
    <footer><Button variant="quiet" onClick={onClose}>Cancel</Button><Button type="submit" disabled={update.isPending || !form.gameId || !form.gameUsername.trim() || !form.platform || !form.skillLevel}>{update.isPending ? "Saving…" : game ? "Save game" : "Add game"}</Button></footer>
  </form></ProfileDialog>;
}
