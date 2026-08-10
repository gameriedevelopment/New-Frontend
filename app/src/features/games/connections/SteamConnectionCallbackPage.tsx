import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, PageLoader, StatePanel } from "../../../components/ui";
import { clearConnectionCallback, connectProvider, readConnectionCallback } from "./api";
import "../games.css";

export function SteamConnectionCallbackPage() {
  const navigate = useNavigate(); const [error, setError] = useState("");
  useEffect(() => { const finish = async () => { const params = new URLSearchParams(window.location.search); const steamId = params.get("steamId"); const returnedState = params.get("state"); const providerError = params.get("error"); const pending = readConnectionCallback(); try { if (providerError) throw new Error(providerError); if (!steamId || !pending.provider) throw new Error("Steam returned an incomplete connection."); if (!returnedState || returnedState !== pending.state) throw new Error("The Steam connection could not be verified safely."); if (!["steam", "dota-2", "cs2"].includes(pending.provider)) throw new Error("The pending Steam connection is invalid."); await connectProvider(pending.provider, { steamId }); const target = pending.returnTo; clearConnectionCallback(); navigate(target, { replace: true, state: { connectionStatus: `${pending.provider} connected` } }); } catch (reason) { clearConnectionCallback(); setError(reason instanceof Error ? reason.message : "Steam connection failed."); } }; void finish(); }, [navigate]);
  if (error) return <main className="connection-callback"><StatePanel tone="error" title="Steam connection failed" description={error} action={<Button onClick={() => navigate("/feed", { replace: true })}>Return to Gamerie</Button>} /></main>;
  return <main className="connection-callback"><PageLoader label="Verifying Steam connection" /></main>;
}
