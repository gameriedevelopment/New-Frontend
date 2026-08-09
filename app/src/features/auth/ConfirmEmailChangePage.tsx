import { AlertCircle, ArrowRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getApiErrorMessage } from "../../lib/errors";
import { confirmEmailChange, syncUserWithBackend } from "./api";

type ChangeState = { status: "working" } | { status: "done"; email: string } | { status: "failed"; message: string };

export function ConfirmEmailChangePage() {
  const { token } = useParams();
  const hasRun = useRef(false);
  const [state, setState] = useState<ChangeState>({ status: "working" });

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;
    if (!token) {
      setState({ status: "failed", message: "This confirmation link is missing its token." });
      return;
    }
    const run = async () => {
      try {
        const result = await confirmEmailChange(token);
        await syncUserWithBackend();
        setState({ status: "done", email: result.email });
      } catch (error) {
        setState({ status: "failed", message: getApiErrorMessage(error, "This link is invalid or has expired. Request a new one.") });
      }
    };
    void run();
  }, [token]);

  return (
    <main className="auth-entry">
      <header className="auth-topbar"><a className="auth-brand" href="http://localhost:5173" aria-label="Gamerie website"><img src="/gamerie-logo.svg" alt="" /><span>Gamerie</span></a></header>
      <section className="auth-stage" aria-labelledby="confirm-change-title">
        <aside className="auth-story" aria-label="About Gamerie"><div className="auth-story__copy"><h1>Your game life,<br /><span>connected.</span></h1><p>Build a credible gaming identity, find your people, and move from playing to belonging.</p></div></aside>
        <section className="auth-panel auth-process">
          {state.status === "working" ? <><span className="auth-process__loader" aria-hidden="true" /><h2 id="confirm-change-title">Updating your email.</h2><p>Please keep this page open for a moment.</p></> : state.status === "done" ? <><h2 id="confirm-change-title">Email updated.</h2><p>Your account now uses <strong>{state.email || "the new email address"}</strong>.</p><Link className="auth-submit auth-process__action" to="/feed">Continue <ArrowRight size={17} /></Link></> : <><AlertCircle className="auth-process__error-mark" size={20} /><h2 id="confirm-change-title">Email not updated.</h2><p>{state.message}</p><Link className="auth-submit auth-process__action" to="/login">Back to sign in <ArrowRight size={17} /></Link></>}
        </section>
      </section>
    </main>
  );
}
