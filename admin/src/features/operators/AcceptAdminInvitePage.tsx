import { useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Brand } from "../../components/Brand";
import { getErrorMessage } from "../../lib/errors";
import { useAcceptAdminInvite, useAdminInviteDetails } from "./hooks";
import "../auth/auth.css";
import "./operators.css";

export function AcceptAdminInvitePage() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const details = useAdminInviteDetails(token);
  const accept = useAcceptAdminInvite();
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (details.data?.requiresPassword && password !== confirmPassword) return;
    accept.mutate({
      token,
      username: username.trim() || undefined,
      fullName: fullName.trim() || undefined,
      password: password || undefined,
    });
  };
  return (
    <main className="admin-sign-in">
      <header>
        <Brand />
      </header>
      <div className="admin-sign-in__layout">
        <section className="admin-sign-in__entry" aria-labelledby="invite-title">
          <div className="admin-sign-in__copy">
            <span className="admin-eyebrow">Administrator invitation</span>
            <h1 id="invite-title">Join operations.</h1>
            <p>
              {details.data
                ? `Accept access for ${details.data.email}.`
                : "Verify your invitation to continue."}
            </p>
          </div>
          {!token || details.isError ? (
            <div className="admin-state-panel">
              <h2>Invitation unavailable</h2>
              <p>
                {!token
                  ? "This link is incomplete."
                  : getErrorMessage(details.error, "This invitation is invalid or expired.")}
              </p>
            </div>
          ) : null}
          {details.isLoading ? (
            <div className="admin-operator-loading" aria-label="Checking invitation" />
          ) : null}
          {details.data && !accept.isSuccess ? (
            <form className="admin-sign-in__form" onSubmit={submit}>
              {details.data.requiresPassword ? (
                <>
                  {details.data.requiresProfile ? (
                    <>
                      <label>
                        <span>Display name</span>
                        <input
                          value={fullName}
                          onChange={(event) => setFullName(event.target.value)}
                        />
                      </label>
                      <label>
                        <span>Username</span>
                        <input
                          required
                          minLength={3}
                          value={username}
                          onChange={(event) => setUsername(event.target.value)}
                        />
                      </label>
                    </>
                  ) : (
                    <p className="admin-invite-note">
                      Create a password for the administrator interface. Your existing sign-in
                      method for the Gamerie player app will not change.
                    </p>
                  )}
                  <label>
                    <span>Password</span>
                    <input
                      type="password"
                      autoComplete="new-password"
                      required
                      minLength={8}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                    />
                  </label>
                  <label>
                    <span>Confirm password</span>
                    <input
                      type="password"
                      autoComplete="new-password"
                      required
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                    />
                  </label>
                  {confirmPassword && password !== confirmPassword ? (
                    <div className="admin-form-error">Passwords do not match.</div>
                  ) : null}
                </>
              ) : (
                <p className="admin-invite-note">
                  Your existing Gamerie account will receive administrator access.
                </p>
              )}
              {accept.isError ? (
                <div className="admin-form-error" role="alert">
                  {getErrorMessage(accept.error, "This invitation could not be accepted.")}
                </div>
              ) : null}
              <button
                type="submit"
                disabled={
                  accept.isPending ||
                  (details.data.requiresPassword && password !== confirmPassword)
                }
              >
                {accept.isPending ? "Accepting…" : "Accept invitation"}
              </button>
            </form>
          ) : null}
          {accept.isSuccess ? (
            <div className="admin-state-panel">
              <h2>Access is ready</h2>
              <p>Sign in with your administrator credentials to enter operations.</p>
              <Link className="admin-primary-button admin-invite-link" to="/sign-in">
                Continue to sign in
              </Link>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
