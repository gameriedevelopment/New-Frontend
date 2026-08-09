import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, ArrowRight, Check, Eye, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { getApiErrorMessage } from "../../lib/errors";
import { signIn } from "./api";
import { SocialAuthOptions } from "./components/SocialAuthOptions";

const schema = z.object({
  email: z.string().trim().min(1, "Enter your email address").email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
  remember: z.boolean().default(false),
});

type SignInFields = z.infer<typeof schema>;

export function SignInPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SignInFields>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "", remember: false },
  });

  useEffect(() => {
    if (searchParams.get("error") === "social_login_failed") {
      setSubmitError(searchParams.get("errorMsg") || "Social sign in was cancelled or failed. Please try again.");
    }
  }, [searchParams]);

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    try {
      const result = await signIn(values.email, values.password, values.remember);
      navigate(result.next === "verify-phone" ? "/verify-phone" : "/feed", { replace: true });
    } catch (error) {
      setSubmitError(getApiErrorMessage(error, "We couldn't sign you in. Check your details and try again."));
    }
  });

  return (
    <main className="auth-entry">
      <header className="auth-topbar">
        <a className="auth-brand" href="http://localhost:5173" aria-label="Gamerie website">
          <img src="/gamerie-logo.svg" alt="" />
          <span>Gamerie</span>
        </a>
        <p>New to Gamerie? <Link to="/register">Create account <ArrowRight size={14} /></Link></p>
      </header>

      <section className="auth-stage" aria-labelledby="signin-title">
        <aside className="auth-story" aria-label="About Gamerie">
          <div className="auth-story__copy">
            <h1>Your game life,<br /><span>connected.</span></h1>
            <p>Build a credible gaming identity, find your people, and move from playing to belonging.</p>
          </div>
        </aside>

        <section className="auth-panel">
          <div className="auth-panel__header">
            <h2 id="signin-title">Welcome back.</h2>
            <p>Sign in to continue to Gamerie.</p>
          </div>

          <form className="auth-form" onSubmit={onSubmit} noValidate>
            {submitError && (
              <div className="auth-error" role="alert"><AlertCircle size={17} /><p><strong>Sign in unsuccessful</strong>{submitError}</p></div>
            )}

            <div className="auth-field" data-invalid={Boolean(errors.email)}>
              <label htmlFor="email">Email address</label>
              <input id="email" type="email" autoComplete="email" placeholder="you@example.com" aria-describedby={errors.email ? "email-error" : undefined} {...register("email")} />
              {errors.email && <small id="email-error" role="alert">{errors.email.message}</small>}
            </div>

            <div className="auth-field" data-invalid={Boolean(errors.password)}>
              <div className="auth-field__label"><label htmlFor="password">Password</label><Link to="/forgot-password">Forgot password?</Link></div>
              <div className="auth-password">
                <input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Enter your password" aria-describedby={errors.password ? "password-error" : undefined} {...register("password")} />
                <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button>
              </div>
              {errors.password && <small id="password-error" role="alert">{errors.password.message}</small>}
            </div>

            <label className="auth-check">
              <input type="checkbox" {...register("remember")} />
              <span className="auth-check__box" aria-hidden="true"><Check size={12} /></span>
              Keep me signed in on this device
            </label>

            <button className="auth-submit" type="submit" disabled={isSubmitting}>
              {isSubmitting ? <><i className="auth-submit__loader" />Signing in…</> : <>Continue to Gamerie <ArrowRight size={17} /></>}
            </button>
          </form>

          <SocialAuthOptions mode="signin" />

          <footer className="auth-panel__footer">
            <p>By continuing, you agree to Gamerie's <a href="/terms">Terms</a> and <a href="/privacy">Privacy Policy</a>.</p>
          </footer>
        </section>
      </section>
    </main>
  );
}
