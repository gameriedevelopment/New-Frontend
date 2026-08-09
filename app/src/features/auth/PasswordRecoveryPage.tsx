import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, ArrowLeft, ArrowRight, Eye, EyeOff } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { getApiErrorMessage } from "../../lib/errors";
import { confirmPasswordReset, requestPasswordReset } from "./api";
import { Turnstile } from "./components/Turnstile";

const requestSchema = z.object({
  email: z.string().trim().min(1, "Enter your email address").email("Enter a valid email address"),
});

const confirmSchema = z.object({
  password: z.string().min(8, "Use at least 8 characters")
    .regex(/[A-Z]/, "Add at least one uppercase letter")
    .regex(/[a-z]/, "Add at least one lowercase letter")
    .regex(/[0-9]/, "Add at least one number")
    .regex(/[^A-Za-z0-9]/, "Add at least one special character"),
  confirmPassword: z.string().min(1, "Confirm your new password"),
}).refine((values) => values.password === values.confirmPassword, {
  path: ["confirmPassword"],
  message: "Passwords do not match",
});

type RequestFields = z.infer<typeof requestSchema>;
type ConfirmFields = z.infer<typeof confirmSchema>;
type RecoveryResult = "request-sent" | "password-reset" | null;

export function PasswordRecoveryPage() {
  const [searchParams] = useSearchParams();
  const resetToken = useMemo(() => {
    const mode = searchParams.get("mode");
    const oobCode = mode === "resetPassword" ? searchParams.get("oobCode") : null;
    return oobCode ?? searchParams.get("resetToken") ?? searchParams.get("token") ?? "";
  }, [searchParams]);
  const isConfirmMode = Boolean(resetToken);
  const [showPassword, setShowPassword] = useState(false);
  const [result, setResult] = useState<RecoveryResult>(null);
  const [requestEmail, setRequestEmail] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRequired = Boolean(import.meta.env.VITE_TURNSTILE_SITE_KEY);

  const requestForm = useForm<RequestFields>({ resolver: zodResolver(requestSchema), defaultValues: { email: "" } });
  const confirmForm = useForm<ConfirmFields>({ resolver: zodResolver(confirmSchema), defaultValues: { password: "", confirmPassword: "" } });
  const onTurnstileVerify = useCallback((token: string) => setTurnstileToken(token), []);
  const onTurnstileExpire = useCallback(() => setTurnstileToken(null), []);

  const submitRequest = requestForm.handleSubmit(async ({ email }) => {
    if (turnstileRequired && !turnstileToken) {
      setSubmitError("Complete the verification check to send a reset link.");
      return;
    }
    setSubmitError(null);
    try {
      await requestPasswordReset(email, turnstileToken ?? undefined);
      setRequestEmail(email);
      setResult("request-sent");
    } catch (error) {
      setTurnstileToken(null);
      setSubmitError(getApiErrorMessage(error, "We couldn't send the reset link. Please try again."));
    }
  });

  const submitReset = confirmForm.handleSubmit(async (values) => {
    setSubmitError(null);
    try {
      await confirmPasswordReset({ ...values, resetToken });
      setResult("password-reset");
    } catch (error) {
      setSubmitError(getApiErrorMessage(error, "This reset link may be invalid or expired. Request a new one and try again."));
    }
  });

  const isSubmitting = requestForm.formState.isSubmitting || confirmForm.formState.isSubmitting;

  return (
    <main className="auth-entry">
      <header className="auth-topbar">
        <a className="auth-brand" href="http://localhost:5173" aria-label="Gamerie website"><img src="/gamerie-logo.svg" alt="" /><span>Gamerie</span></a>
        {!result && <p>Remembered it? <Link to="/login">Sign in <ArrowRight size={14} /></Link></p>}
      </header>

      <section className="auth-stage" aria-labelledby="recovery-title">
        <aside className="auth-story" aria-label="About Gamerie"><div className="auth-story__copy"><h1>Your game life,<br /><span>connected.</span></h1><p>Build a credible gaming identity, find your people, and move from playing to belonging.</p></div></aside>

        <section className="auth-panel auth-recovery">
          {result === "request-sent" ? <>
            <h2 id="recovery-title">Check your email.</h2>
            <p>If an account exists for <strong>{requestEmail}</strong>, a password-reset link is on its way.</p>
            <p className="auth-recovery__note">The link may take a few minutes to arrive. Check your spam folder if you do not see it.</p>
            <div className="auth-recovery__links"><button type="button" onClick={() => { setResult(null); setSubmitError(null); }}>Use another email</button><Link to="/login">Back to sign in</Link></div>
          </> : result === "password-reset" ? <>
            <h2 id="recovery-title">Password updated.</h2>
            <p>Your new password is ready. You can now return to Gamerie.</p>
            <Link className="auth-submit auth-recovery__primary" to="/login">Continue to sign in <ArrowRight size={17} /></Link>
          </> : <>
            <div className="auth-panel__header">
              <h2 id="recovery-title">{isConfirmMode ? "Create a new password." : "Reset your password."}</h2>
              <p>{isConfirmMode ? "Choose a new password for your account." : "Enter your email and we'll send you a secure reset link."}</p>
            </div>

            <form className="auth-form" onSubmit={isConfirmMode ? submitReset : submitRequest} noValidate>
              {submitError && <div className="auth-error" role="alert"><AlertCircle size={17} /><p><strong>{isConfirmMode ? "Password not updated" : "Link not sent"}</strong>{submitError}</p></div>}

              {isConfirmMode ? <>
                <div className="auth-field" data-invalid={Boolean(confirmForm.formState.errors.password)}><label htmlFor="new-password">New password</label><div className="auth-password"><input id="new-password" type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder="Create a new password" {...confirmForm.register("password")} /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div>{confirmForm.formState.errors.password ? <small role="alert">{confirmForm.formState.errors.password.message}</small> : <p className="auth-field__hint">At least 8 characters with uppercase, lowercase, number, and symbol.</p>}</div>
                <div className="auth-field" data-invalid={Boolean(confirmForm.formState.errors.confirmPassword)}><label htmlFor="confirm-new-password">Confirm new password</label><input id="confirm-new-password" type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder="Enter the password again" {...confirmForm.register("confirmPassword")} />{confirmForm.formState.errors.confirmPassword && <small role="alert">{confirmForm.formState.errors.confirmPassword.message}</small>}</div>
              </> : <>
                <div className="auth-field" data-invalid={Boolean(requestForm.formState.errors.email)}><label htmlFor="recovery-email">Email address</label><input id="recovery-email" type="email" autoComplete="email" placeholder="you@example.com" {...requestForm.register("email")} />{requestForm.formState.errors.email && <small role="alert">{requestForm.formState.errors.email.message}</small>}</div>
                <Turnstile onVerify={onTurnstileVerify} onExpire={onTurnstileExpire} />
              </>}

              <button className="auth-submit" type="submit" disabled={isSubmitting || (!isConfirmMode && turnstileRequired && !turnstileToken)}>{isSubmitting ? <><i className="auth-submit__loader" />{isConfirmMode ? "Updating password…" : "Sending link…"}</> : <>{isConfirmMode ? "Update password" : "Send reset link"}<ArrowRight size={17} /></>}</button>
              <Link className="auth-back-link auth-back-link--form" to="/login"><ArrowLeft size={15} />Back to sign in</Link>
            </form>
          </>}
        </section>
      </section>
    </main>
  );
}
