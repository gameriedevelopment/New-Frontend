import { AlertCircle, ArrowLeft } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getApiErrorMessage } from "../../lib/errors";
import { resendConfirmationEmail, signOut } from "./api";
import { useAuthStore } from "./authStore";
import { Turnstile } from "./components/Turnstile";

export function VerifyEmailPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const clearUser = useAuthStore((state) => state.clearUser);
  const setVerificationOngoing = useAuthStore((state) => state.setVerificationOngoing);
  const email = user?.email ?? sessionStorage.getItem("Gamerie_pending_email");
  const [countdown, setCountdown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);
  const turnstileRequired = Boolean(import.meta.env.VITE_TURNSTILE_SITE_KEY);

  useEffect(() => {
    if (user?.emailVerified) navigate("/feed", { replace: true });
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [navigate, user?.emailVerified]);

  const startCountdown = () => {
    setCountdown(60);
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      setCountdown((current) => {
        if (current <= 1) {
          if (timerRef.current) window.clearInterval(timerRef.current);
          timerRef.current = null;
          return 0;
        }
        return current - 1;
      });
    }, 1000);
  };

  const resend = async () => {
    if (!email) {
      setError("Sign in again before requesting another verification email.");
      return;
    }
    if (turnstileRequired && !turnstileToken) {
      setError("Complete the verification check before resending the email.");
      return;
    }
    try {
      setIsResending(true);
      setError(null);
      setMessage(null);
      await resendConfirmationEmail(email, turnstileToken ?? undefined);
      setMessage("A new verification email has been sent.");
      setTurnstileToken(null);
      setVerificationOngoing(false);
      startCountdown();
    } catch (requestError) {
      const status = (requestError as { response?: { status?: number } }).response?.status;
      setError(
        status === 400
          ? "This email address is already verified."
          : status === 404
            ? "We couldn't find this account."
            : getApiErrorMessage(requestError, "We couldn't resend the verification email."),
      );
    } finally {
      setIsResending(false);
    }
  };

  const backToLogin = async () => {
    try {
      await signOut();
    } catch {
      clearUser();
    }
    navigate("/login", { replace: true });
  };

  const onTurnstileVerify = useCallback((token: string) => setTurnstileToken(token), []);
  const onTurnstileExpire = useCallback(() => setTurnstileToken(null), []);

  return (
    <main className="auth-entry">
      <header className="auth-topbar">
        <a className="auth-brand" href="http://localhost:5173" aria-label="Gamerie website">
          <img src="/gamerie-logo.svg" alt="" />
          <span>Gamerie</span>
        </a>
      </header>
      <section className="auth-stage" aria-labelledby="verify-email-title">
        <aside className="auth-story" aria-label="About Gamerie">
          <div className="auth-story__copy">
            <h1>
              Your game life,
              <br />
              <span>connected.</span>
            </h1>
            <p>
              Build a credible gaming identity, find your people, and move from playing to
              belonging.
            </p>
          </div>
        </aside>
        <section className="auth-panel auth-confirmation">
          <h2 id="verify-email-title">Check your email.</h2>
          <p>
            We sent a verification link
            {email ? (
              <>
                {" "}
                to <strong>{email}</strong>
              </>
            ) : (
              " to your email address"
            )}
            . Open it to finish creating your account.
          </p>
          <p className="auth-confirmation__note">
            It may take a few minutes to arrive. Check your spam folder if you do not see it.
          </p>
          {message && (
            <p className="auth-inline-success" role="status">
              {message}
            </p>
          )}
          {error && (
            <div className="auth-error" role="alert">
              <AlertCircle size={17} />
              <p>
                <strong>Email not sent</strong>
                {error}
              </p>
            </div>
          )}
          <Turnstile onVerify={onTurnstileVerify} onExpire={onTurnstileExpire} />
          <button
            className="auth-secondary-action"
            type="button"
            onClick={resend}
            disabled={isResending || countdown > 0 || (turnstileRequired && !turnstileToken)}
          >
            {isResending
              ? "Sending…"
              : countdown > 0
                ? `Resend available in ${countdown}s`
                : "Resend verification email"}
          </button>
          <button className="auth-back auth-confirmation__back" type="button" onClick={backToLogin}>
            <ArrowLeft size={15} />
            Back to sign in
          </button>
        </section>
      </section>
    </main>
  );
}
