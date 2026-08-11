import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, PageLoader, StatePanel } from "../../../components/ui";
import { clearConnectionCallback, finishLichessConnection, readConnectionCallback } from "./api";
import "../games.css";

export function LichessConnectionCallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  useEffect(() => {
    const finish = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const returnedState = params.get("state");
      const providerError = params.get("error_description") || params.get("error");
      const pending = readConnectionCallback();
      try {
        if (providerError) throw new Error(providerError);
        if (!code || !pending.verifier)
          throw new Error("Lichess returned an incomplete connection.");
        if (!returnedState || returnedState !== pending.state || pending.provider !== "lichess")
          throw new Error("The Lichess connection could not be verified safely.");
        await finishLichessConnection(code, pending.verifier);
        const target = pending.returnTo;
        clearConnectionCallback();
        navigate(target, { replace: true, state: { connectionStatus: "Lichess connected" } });
      } catch (reason) {
        clearConnectionCallback();
        setError(reason instanceof Error ? reason.message : "Lichess connection failed.");
      }
    };
    void finish();
  }, [navigate]);
  if (error)
    return (
      <main className="connection-callback">
        <StatePanel
          tone="error"
          title="Lichess connection failed"
          description={error}
          action={
            <Button onClick={() => navigate("/feed", { replace: true })}>Return to Gamerie</Button>
          }
        />
      </main>
    );
  return (
    <main className="connection-callback">
      <PageLoader label="Verifying Lichess connection" />
    </main>
  );
}
