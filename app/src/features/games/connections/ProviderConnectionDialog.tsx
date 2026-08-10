import { useMemo, useState, type CSSProperties, type FormEvent } from "react";
import { Button } from "../../../components/ui";
import { getApiErrorMessage } from "../../../lib/errors";
import { ProfileDialog } from "../../profile/components/interactions/ProfileDialog";
import type { GameProviderId } from "../types";
import { useConnectProvider } from "./hooks";
import { getProvider, riotProduct } from "./registry";

const regions = ["EUW", "EUNE", "NA", "BR", "KR", "JP", "LATAM", "OCE", "TR"];

export function ProviderConnectionDialog({ providerId, onClose }: { providerId: GameProviderId; onClose: () => void }) {
  const provider = getProvider(providerId);
  const connect = useConnectProvider();
  const [primary, setPrimary] = useState("");
  const [region, setRegion] = useState(provider.connectKind === "battlenet" ? "us" : provider.connectKind === "pubg" ? "steam" : "EUW");
  const [secondary, setSecondary] = useState(provider.connectKind === "battlenet" ? "1" : "");
  const payload = useMemo(() => {
    if (provider.connectKind === "tag") return { tag: primary.trim() };
    if (provider.connectKind === "riot") return { riotId: primary.trim(), region };
    if (provider.connectKind === "pubg") return { playerName: primary.trim(), platform: region };
    return { profileId: primary.trim(), realmId: secondary.trim(), region };
  }, [primary, provider.connectKind, region, secondary]);
  const submit = async (event: FormEvent) => { event.preventDefault(); try { await connect.mutateAsync({ provider: providerId, payload }); onClose(); } catch { /* rendered below */ } };
  const primaryLabel = provider.connectKind === "tag" ? "Player tag" : provider.connectKind === "riot" ? "Riot ID" : provider.connectKind === "pubg" ? "Player name" : "StarCraft II profile ID";
  const primaryHint = provider.connectKind === "tag" ? "Include the # if it appears in your profile." : provider.connectKind === "riot" ? `Use the complete GameName#TAG shown in ${riotProduct(providerId).toUpperCase()}.` : provider.connectKind === "pubg" ? "Use the exact capitalization shown in-game." : "Found in the final part of your public SC2 profile URL.";
  const valid = primary.trim().length > 1 && (provider.connectKind !== "riot" || primary.includes("#")) && (provider.connectKind !== "battlenet" || secondary.trim().length > 0);
  return <ProfileDialog title={`Connect ${provider.name}`} onClose={onClose}><form className="provider-connect-form" onSubmit={submit}>
    <div className="provider-connect-form__intro"><span style={{ "--provider-color": provider.accent } as CSSProperties}>{provider.initials}</span><div><strong>Verify the account you own</strong><p>Gamerie checks this identity with {provider.family} before saving it to your profile.</p></div></div>
    <label><span>{primaryLabel}</span><input autoFocus value={primary} onChange={(event) => setPrimary(event.target.value)} placeholder={provider.connectKind === "tag" ? "#PLAYER9" : provider.connectKind === "riot" ? "GameName#TAG" : provider.connectKind === "pubg" ? "Player name" : "1234567"} /><small>{primaryHint}</small></label>
    {provider.connectKind === "riot" ? <label><span>Region</span><select value={region} onChange={(event) => setRegion(event.target.value)}>{regions.map((item) => <option key={item}>{item}</option>)}</select></label> : null}
    {provider.connectKind === "pubg" ? <label><span>Platform</span><select value={region} onChange={(event) => setRegion(event.target.value)}><option value="steam">Steam</option><option value="psn">PlayStation</option><option value="xbox">Xbox</option><option value="kakao">Kakao</option></select></label> : null}
    {provider.connectKind === "battlenet" ? <div className="provider-connect-form__pair"><label><span>Region</span><select value={region} onChange={(event) => setRegion(event.target.value)}><option value="us">Americas</option><option value="eu">Europe</option><option value="kr">Korea</option><option value="tw">Taiwan</option></select></label><label><span>Realm ID</span><input value={secondary} onChange={(event) => setSecondary(event.target.value)} inputMode="numeric" /></label></div> : null}
    {connect.isError ? <p className="provider-connect-form__error" role="alert">{getApiErrorMessage(connect.error, `${provider.name} could not be connected.`)}</p> : null}
    <footer><Button variant="quiet" onClick={onClose}>Cancel</Button><Button type="submit" disabled={!valid || connect.isPending}>{connect.isPending ? "Verifying account…" : "Verify and connect"}</Button></footer>
  </form></ProfileDialog>;
}
