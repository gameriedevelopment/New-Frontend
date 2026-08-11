import { useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Brand } from "../../components/Brand";
import { getErrorMessage } from "../../lib/errors";
import { useAdminAuth } from "./AuthProvider";
import "./auth.css";

export function AdminSignInPage() {
  const { signIn, status } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (status === "authenticated") return <Navigate to="/" replace />;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await signIn(email.trim(), password);
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from && from !== "/sign-in" ? from : "/", { replace: true });
    } catch (nextError) {
      setError(getErrorMessage(nextError, "We could not verify this administrator account."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="admin-sign-in">
      <header>
        <Brand />
      </header>
      <div className="admin-sign-in__layout">
        <section className="admin-sign-in__entry" aria-labelledby="admin-entry-title">
          <div className="admin-sign-in__copy">
            <span className="admin-eyebrow">Gamerie operations</span>
            <h1 id="admin-entry-title">Sign in.</h1>
            <p>Continue with your Gamerie administrator account.</p>
          </div>
          <form className="admin-sign-in__form" onSubmit={submit}>
            {error && (
              <div className="admin-form-error" role="alert">
                {error}
              </div>
            )}
            <label>
              <span>Email address</span>
              <input
                type="email"
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>
            <label>
              <span>Password</span>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>
            <button type="submit" disabled={busy}>
              {busy ? "Signing in…" : "Continue"}
            </button>
            <small>Restricted to authorized Gamerie operators.</small>
          </form>
        </section>
      </div>
    </main>
  );
}
