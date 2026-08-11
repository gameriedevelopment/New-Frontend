import { AlertCircle, ArrowLeft, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import PhoneInput, { isValidPhoneNumber, type Value } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { useNavigate } from "react-router-dom";
import { getApiErrorMessage } from "../../lib/errors";
import {
  checkPhoneCode,
  fetchSmsVerificationEnabled,
  sendPhoneCode,
  signOut,
  syncUserWithBackend,
} from "./api";
import { useAuthStore } from "./authStore";

type VerificationStep = "phone" | "code";

export function VerifyPhonePage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const status = useAuthStore((state) => state.status);
  const clearUser = useAuthStore((state) => state.clearUser);
  const [step, setStep] = useState<VerificationStep>("phone");
  const [phone, setPhone] = useState<Value>();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);

  useEffect(() => {
    let active = true;

    const checkAccess = async () => {
      if (!user) {
        navigate("/login", { replace: true });
        return;
      }
      if (status !== "active") {
        navigate("/verify-email", { replace: true });
        return;
      }
      if (user.phoneVerified) {
        navigate("/feed", { replace: true });
        return;
      }

      const smsVerificationEnabled = await fetchSmsVerificationEnabled();
      if (!active) return;
      if (!smsVerificationEnabled) {
        navigate("/feed", { replace: true });
        return;
      }
      setIsCheckingAccess(false);
    };

    void checkAccess();
    return () => {
      active = false;
    };
  }, [navigate, status, user]);

  const sendCode = async () => {
    if (!phone || !isValidPhoneNumber(phone)) {
      setError("Enter a valid phone number, including its country code.");
      return;
    }

    try {
      setError(null);
      setIsSubmitting(true);
      await sendPhoneCode(phone);
      setStep("code");
    } catch (requestError) {
      setError(
        getApiErrorMessage(requestError, "We couldn't send a verification code. Try again."),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const verifyCode = async () => {
    if (!phone || code.trim().length < 4) {
      setError("Enter the verification code sent to your phone.");
      return;
    }

    try {
      setError(null);
      setIsSubmitting(true);
      await checkPhoneCode(phone, code.trim());
      await syncUserWithBackend();
      navigate("/feed", { replace: true });
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "That code is invalid or has expired."));
    } finally {
      setIsSubmitting(false);
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

  const editNumber = () => {
    setCode("");
    setError(null);
    setStep("phone");
  };

  return (
    <main className="auth-entry">
      <header className="auth-topbar">
        <a className="auth-brand" href="http://localhost:5173" aria-label="Gamerie website">
          <img src="/gamerie-logo.svg" alt="" />
          <span>Gamerie</span>
        </a>
      </header>
      <section className="auth-stage" aria-labelledby="verify-phone-title">
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
        <section className="auth-panel auth-phone">
          {isCheckingAccess ? (
            <div className="auth-process" role="status">
              <span className="auth-process__loader" aria-hidden="true" />
              <h2 id="verify-phone-title">Preparing verification.</h2>
              <p>Checking what your account needs next.</p>
            </div>
          ) : (
            <>
              <div className="auth-panel__header">
                <h2 id="verify-phone-title">Verify your phone.</h2>
                <p>
                  {step === "phone" ? (
                    "Add a number we can use to secure your account."
                  ) : (
                    <>
                      Enter the code sent to <strong>{phone}</strong>.
                    </>
                  )}
                </p>
              </div>

              <div className="auth-form">
                {error && (
                  <div className="auth-error" role="alert">
                    <AlertCircle size={17} />
                    <p>
                      <strong>Verification not completed</strong>
                      {error}
                    </p>
                  </div>
                )}

                {step === "phone" ? (
                  <div className="auth-field auth-phone-input">
                    <label htmlFor="phone-number">Phone number</label>
                    <PhoneInput
                      id="phone-number"
                      international
                      defaultCountry="US"
                      value={phone}
                      onChange={setPhone}
                      placeholder="Enter phone number"
                      autoComplete="tel"
                    />
                  </div>
                ) : (
                  <div className="auth-field auth-code-input">
                    <label htmlFor="verification-code">Verification code</label>
                    <input
                      id="verification-code"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      value={code}
                      onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
                      placeholder="6-digit code"
                      autoFocus
                    />
                  </div>
                )}

                <button
                  className="auth-submit"
                  type="button"
                  onClick={step === "phone" ? sendCode : verifyCode}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="auth-submit__loader" />
                      {step === "phone" ? "Sending code…" : "Verifying…"}
                    </>
                  ) : (
                    <>
                      {step === "phone" ? "Send verification code" : "Verify and continue"}
                      <ArrowRight size={17} />
                    </>
                  )}
                </button>

                {step === "code" && (
                  <button
                    className="auth-secondary-action"
                    type="button"
                    onClick={editNumber}
                    disabled={isSubmitting}
                  >
                    Change number or resend code
                  </button>
                )}
              </div>

              <button
                className="auth-back auth-confirmation__back"
                type="button"
                onClick={backToLogin}
              >
                <ArrowLeft size={15} />
                Back to sign in
              </button>
            </>
          )}
        </section>
      </section>
    </main>
  );
}
