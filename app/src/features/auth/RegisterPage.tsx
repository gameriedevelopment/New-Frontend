import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, ArrowLeft, ArrowRight, Check, Eye, EyeOff } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { getApiErrorMessage } from "../../lib/errors";
import { registerAccount } from "./api";
import { SocialAuthOptions } from "./components/SocialAuthOptions";
import { Turnstile } from "./components/Turnstile";

const titles = ["Player", "Streamer", "Spectator", "Coach", "Trainer", "Analyst"] as const;
const levels = ["Hobbyist", "Amateur", "Advanced", "Competitor", "Pro"] as const;
const platforms = ["PC", "XBOX", "PS5", "Switch", "Mobile"] as const;

const registrationSchema = z
  .object({
    username: z
      .string()
      .trim()
      .min(3, "Use at least 3 characters")
      .max(30, "Use no more than 30 characters"),
    email: z
      .string()
      .trim()
      .min(1, "Enter your email address")
      .email("Enter a valid email address"),
    dateOfBirth: z
      .string()
      .min(1, "Enter your date of birth")
      .refine((value) => {
        const birthDate = new Date(value);
        if (Number.isNaN(birthDate.getTime())) return false;
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const month = today.getMonth() - birthDate.getMonth();
        if (month < 0 || (month === 0 && today.getDate() < birthDate.getDate())) age -= 1;
        return age >= 16;
      }, "You must be 16 or older to create an account"),
    password: z
      .string()
      .min(8, "Use at least 8 characters")
      .regex(/[A-Z]/, "Add at least one uppercase letter")
      .regex(/[a-z]/, "Add at least one lowercase letter")
      .regex(/[0-9]/, "Add at least one number")
      .regex(/[^A-Za-z0-9]/, "Add at least one special character"),
    confirmPassword: z.string().min(1, "Confirm your password"),
    termsAccepted: z.boolean().refine(Boolean, "Accept the terms to continue"),
    gamerTitle: z.enum(titles, {
      errorMap: () => ({ message: "Choose the option that describes you" }),
    }),
    gameLevel: z.enum(levels, { errorMap: () => ({ message: "Choose your gaming level" }) }),
    platforms: z.array(z.enum(platforms)).min(1, "Choose at least one platform"),
    referralCode: z.string().trim().max(32, "Referral code is too long").optional(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

type RegistrationFields = z.infer<typeof registrationSchema>;
type RegistrationStep = 1 | 2 | 3;

const fieldsByStep: Record<RegistrationStep, Array<keyof RegistrationFields>> = {
  1: ["username", "email", "dateOfBirth"],
  2: ["password", "confirmPassword", "termsAccepted"],
  3: ["gamerTitle", "gameLevel", "platforms", "referralCode"],
};

export function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState<RegistrationStep>(1);
  const [showPassword, setShowPassword] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRequired = Boolean(import.meta.env.VITE_TURNSTILE_SITE_KEY);
  const {
    register,
    handleSubmit,
    trigger,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegistrationFields>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      username: "",
      email: "",
      dateOfBirth: "",
      password: "",
      confirmPassword: "",
      termsAccepted: false,
      platforms: [],
      referralCode: "",
    },
  });

  useEffect(() => {
    const referralCode = searchParams.get("ref");
    if (referralCode) setValue("referralCode", referralCode.toUpperCase());
    if (searchParams.get("error") === "social_login_failed") {
      setSubmitError(
        searchParams.get("errorMsg") || "Social sign up was cancelled or failed. Please try again.",
      );
    }
  }, [searchParams, setValue]);

  const nextStep = async () => {
    if (await trigger(fieldsByStep[step])) {
      setSubmitError(null);
      setStep((current) => Math.min(3, current + 1) as RegistrationStep);
    }
  };

  const onTurnstileVerify = useCallback((token: string) => setTurnstileToken(token), []);
  const onTurnstileExpire = useCallback(() => setTurnstileToken(null), []);

  const onSubmit = handleSubmit(async (values) => {
    if (turnstileRequired && !turnstileToken) {
      setSubmitError("Complete the verification check to create your account.");
      return;
    }
    setSubmitError(null);
    try {
      await registerAccount({
        email: values.email,
        password: values.password,
        username: values.username,
        role: "user",
        gamerTitle: values.gamerTitle,
        gameLevel: values.gameLevel,
        platforms: values.platforms,
        termsAccepted: values.termsAccepted,
        dateOfBirth: values.dateOfBirth,
        referralCode: values.referralCode || undefined,
        turnstileToken: turnstileToken ?? undefined,
      });
      navigate("/verify-email", { replace: true });
    } catch (error) {
      const message = getApiErrorMessage(
        error,
        "We couldn't create your account. Please try again.",
      );
      setSubmitError(message);
      if ((error as { response?: { status?: number } }).response?.status === 409) setStep(1);
    }
  });

  return (
    <main className="auth-entry">
      <header className="auth-topbar">
        <a className="auth-brand" href="http://localhost:5173" aria-label="Gamerie website">
          <img src="/gamerie-logo.svg" alt="" />
          <span>Gamerie</span>
        </a>
        <p>
          Already have an account?{" "}
          <Link to="/login">
            Sign in <ArrowRight size={14} />
          </Link>
        </p>
      </header>

      <section className="auth-stage auth-stage--register" aria-labelledby="register-title">
        <aside className="auth-story" aria-label="About Gamerie">
          <div className="auth-story__copy">
            <h1>
              Bring your game life
              <br />
              <span>together.</span>
            </h1>
            <p>
              Create one identity for the games you play, the people you meet, and the progress you
              make.
            </p>
          </div>
        </aside>

        <section className="auth-panel auth-panel--register">
          <div className="auth-panel__header auth-panel__header--stepped">
            <span>Step {step} of 3</span>
            <h2 id="register-title">Create your account.</h2>
            <p>Start with the essentials. You can add more later.</p>
          </div>

          <form className="auth-form" onSubmit={onSubmit} noValidate>
            {submitError && (
              <div className="auth-error" role="alert">
                <AlertCircle size={17} />
                <p>
                  <strong>Account not created</strong>
                  {submitError}
                </p>
              </div>
            )}

            {step === 1 && (
              <>
                <div className="auth-form__row">
                  <div className="auth-field" data-invalid={Boolean(errors.username)}>
                    <label htmlFor="username">Username</label>
                    <input
                      id="username"
                      autoComplete="username"
                      placeholder="Choose a username"
                      {...register("username")}
                    />
                    {errors.username && <small role="alert">{errors.username.message}</small>}
                  </div>
                  <div className="auth-field" data-invalid={Boolean(errors.email)}>
                    <label htmlFor="register-email">Email address</label>
                    <input
                      id="register-email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      {...register("email")}
                    />
                    {errors.email && <small role="alert">{errors.email.message}</small>}
                  </div>
                </div>
                <div className="auth-field" data-invalid={Boolean(errors.dateOfBirth)}>
                  <label htmlFor="date-of-birth">Date of birth</label>
                  <input
                    id="date-of-birth"
                    type="date"
                    autoComplete="bday"
                    max={new Date().toISOString().split("T")[0]}
                    {...register("dateOfBirth")}
                  />
                  {errors.dateOfBirth && <small role="alert">{errors.dateOfBirth.message}</small>}
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div className="auth-field" data-invalid={Boolean(errors.password)}>
                  <label htmlFor="register-password">Password</label>
                  <div className="auth-password">
                    <input
                      id="register-password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Create a password"
                      {...register("password")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                  {errors.password ? (
                    <small role="alert">{errors.password.message}</small>
                  ) : (
                    <p className="auth-field__hint">
                      At least 8 characters with uppercase, lowercase, number, and symbol.
                    </p>
                  )}
                </div>
                <div className="auth-field" data-invalid={Boolean(errors.confirmPassword)}>
                  <label htmlFor="confirm-password">Confirm password</label>
                  <input
                    id="confirm-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Enter the password again"
                    {...register("confirmPassword")}
                  />
                  {errors.confirmPassword && (
                    <small role="alert">{errors.confirmPassword.message}</small>
                  )}
                </div>
                <label className="auth-check auth-check--terms">
                  <input type="checkbox" {...register("termsAccepted")} />
                  <span className="auth-check__box" aria-hidden="true">
                    <Check size={12} />
                  </span>
                  <span className="auth-check__copy">
                    I agree to Gamerie's{" "}
                    <a href={import.meta.env.VITE_TERMS_OF_SERVICE || "/terms"}>Terms</a> and{" "}
                    <a href={import.meta.env.VITE_PRIVACY_POLICY || "/privacy"}>Privacy Policy</a>.
                  </span>
                </label>
                {errors.termsAccepted && (
                  <p className="auth-check-error" role="alert">
                    {errors.termsAccepted.message}
                  </p>
                )}
              </>
            )}

            {step === 3 && (
              <>
                <div className="auth-form__row">
                  <div className="auth-field" data-invalid={Boolean(errors.gamerTitle)}>
                    <label htmlFor="gamer-title">What best describes you?</label>
                    <select id="gamer-title" defaultValue="" {...register("gamerTitle")}>
                      <option value="" disabled>
                        Select one
                      </option>
                      {titles.map((title) => (
                        <option key={title}>{title}</option>
                      ))}
                    </select>
                    {errors.gamerTitle && <small role="alert">{errors.gamerTitle.message}</small>}
                  </div>
                  <div className="auth-field" data-invalid={Boolean(errors.gameLevel)}>
                    <label htmlFor="game-level">Gaming level</label>
                    <select id="game-level" defaultValue="" {...register("gameLevel")}>
                      <option value="" disabled>
                        Select one
                      </option>
                      {levels.map((level) => (
                        <option key={level}>{level}</option>
                      ))}
                    </select>
                    {errors.gameLevel && <small role="alert">{errors.gameLevel.message}</small>}
                  </div>
                </div>
                <fieldset className="auth-platforms">
                  <legend>Platforms</legend>
                  <div>
                    {platforms.map((platform) => (
                      <label key={platform}>
                        <input type="checkbox" value={platform} {...register("platforms")} />
                        <span>{platform}</span>
                      </label>
                    ))}
                  </div>
                  {errors.platforms && <small role="alert">{errors.platforms.message}</small>}
                </fieldset>
                <div className="auth-field" data-invalid={Boolean(errors.referralCode)}>
                  <label htmlFor="referral-code">
                    Referral code <span>Optional</span>
                  </label>
                  <input
                    id="referral-code"
                    autoComplete="off"
                    placeholder="Enter code"
                    {...register("referralCode")}
                  />
                  {errors.referralCode && <small role="alert">{errors.referralCode.message}</small>}
                </div>
                <Turnstile onVerify={onTurnstileVerify} onExpire={onTurnstileExpire} />
              </>
            )}

            <div className="auth-actions">
              {step > 1 && (
                <button
                  className="auth-back"
                  type="button"
                  onClick={() => setStep((current) => (current - 1) as RegistrationStep)}
                >
                  <ArrowLeft size={15} />
                  Back
                </button>
              )}
              {step < 3 ? (
                <button className="auth-submit" type="button" onClick={nextStep}>
                  Continue <ArrowRight size={17} />
                </button>
              ) : (
                <button
                  className="auth-submit"
                  type="submit"
                  disabled={isSubmitting || (turnstileRequired && !turnstileToken)}
                >
                  {isSubmitting ? (
                    <>
                      <i className="auth-submit__loader" />
                      Creating account…
                    </>
                  ) : (
                    <>
                      Create account <ArrowRight size={17} />
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
          {step === 1 && <SocialAuthOptions mode="signup" />}
        </section>
      </section>
    </main>
  );
}
