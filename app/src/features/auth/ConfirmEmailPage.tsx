import { AlertCircle, ArrowRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getApiErrorMessage } from "../../lib/errors";
import { publicLinks } from "../../config/links";
import { confirmEmail, fetchSmsVerificationEnabled } from "./api";

type ConfirmationState =
  | { status: "working" }
  | { status: "done"; next: "/verify-phone" | "/feed" }
  | { status: "failed"; message: string };

export function ConfirmEmailPage() {
  const { token } = useParams();
  const hasRun = useRef(false);
  const [state, setState] = useState<ConfirmationState>({ status: "working" });

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;
    if (!token) {
      setState({ status: "failed", message: "This confirmation link is missing its token." });
      return;
    }

    const run = async () => {
      try {
        await confirmEmail(token);
        const phoneVerificationRequired = await fetchSmsVerificationEnabled();
        setState({ status: "done", next: phoneVerificationRequired ? "/verify-phone" : "/feed" });
      } catch (error) {
        setState({
          status: "failed",
          message: getApiErrorMessage(
            error,
            "This link is invalid or has expired. Request a new one.",
          ),
        });
      }
    };
    void run();
  }, [token]);

  return (
    <main className="auth-entry">
      <header className="auth-topbar">
        <a className="auth-brand" href={publicLinks.website} aria-label="Gamerie website">
          <img src="/gamerie-logo.svg" alt="" />
          <span>Gamerie</span>
        </a>
      </header>
      <section className="auth-stage" aria-labelledby="confirm-email-title">
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
        <section className="auth-panel auth-process">
          {state.status === "working" ? (
            <>
              <span className="auth-process__loader" aria-hidden="true" />
              <h2 id="confirm-email-title">Confirming your email.</h2>
              <p>Please keep this page open for a moment.</p>
            </>
          ) : state.status === "done" ? (
            <>
              <h2 id="confirm-email-title">Email confirmed.</h2>
              <p>Your email address is verified and your account is ready for the next step.</p>
              <Link className="auth-submit auth-process__action" to={state.next}>
                {state.next === "/verify-phone" ? "Verify phone number" : "Continue to Gamerie"}
                <ArrowRight size={17} />
              </Link>
            </>
          ) : (
            <>
              <AlertCircle className="auth-process__error-mark" size={20} />
              <h2 id="confirm-email-title">Link not confirmed.</h2>
              <p>{state.message}</p>
              <Link className="auth-submit auth-process__action" to="/login">
                Back to sign in <ArrowRight size={17} />
              </Link>
            </>
          )}
        </section>
      </section>
    </main>
  );
}
