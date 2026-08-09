import { zodResolver } from "@hookform/resolvers/zod";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import { AlertCircle, ArrowRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { getApiErrorMessage } from "../../lib/errors";
import { fetchUserProfile, updateSocialProfile } from "./api";
import { useAuthStore } from "./authStore";

const titles = ["Player", "Streamer", "Spectator", "Coach", "Trainer", "Analyst"] as const;
const levels = ["Hobbyist", "Amateur", "Advanced", "Competitor", "Pro"] as const;
const platforms = ["PC", "XBOX", "PS5", "Switch", "Mobile"] as const;

const profileSchema = z.object({
  username: z.string().trim().min(3, "Use at least 3 characters"),
  gamerTitle: z.enum(titles, { errorMap: () => ({ message: "Choose the option that describes you" }) }),
  gameLevel: z.enum(levels, { errorMap: () => ({ message: "Choose your gaming level" }) }),
  platforms: z.array(z.enum(platforms)).min(1, "Choose at least one platform"),
});

type ProfileFields = z.infer<typeof profileSchema>;
type CallbackState = "working" | "profile" | "failed";

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const hasRun = useRef(false);
  const [state, setState] = useState<CallbackState>("working");
  const [userId, setUserId] = useState("");
  const [callbackError, setCallbackError] = useState("We couldn't complete this sign in. Please try again.");
  const setUser = useAuthStore((store) => store.setUser);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ProfileFields>({
    resolver: zodResolver(profileSchema),
    defaultValues: { username: "", platforms: [] },
  });

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;
    const token = searchParams.get("token");
    const id = searchParams.get("id");
    if (!token || !id) {
      setState("failed");
      return;
    }

    const completeCallback = async () => {
      try {
        const decoded = jwtDecode<{ exp?: number }>(token);
        Cookies.set("auth_token", token, {
          secure: window.location.protocol === "https:",
          sameSite: "Lax",
          ...(decoded.exp ? { expires: new Date(decoded.exp * 1000) } : {}),
        });
        const profile = await fetchUserProfile(id);
        if (profile.isFirstSocialLogin) {
          setUserId(profile.id);
          setState("profile");
          return;
        }
        setUser(profile);
        navigate("/", { replace: true });
      } catch (error) {
        Cookies.remove("auth_token");
        setCallbackError(getApiErrorMessage(error, "We couldn't complete this sign in. Please try again."));
        setState("failed");
      }
    };
    void completeCallback();
  }, [navigate, searchParams, setUser]);

  const submitProfile = handleSubmit(async (values) => {
    try {
      setCallbackError("");
      await updateSocialProfile(userId, values);
      const profile = await fetchUserProfile(userId);
      setUser(profile);
      navigate("/", { replace: true });
    } catch (error) {
      setCallbackError(getApiErrorMessage(error, "We couldn't save your gaming profile. Try again."));
    }
  });

  return (
    <main className="auth-entry">
      <header className="auth-topbar"><a className="auth-brand" href="http://localhost:5173" aria-label="Gamerie website"><img src="/gamerie-logo.svg" alt="" /><span>Gamerie</span></a></header>
      <section className={`auth-stage${state === "profile" ? " auth-stage--register" : ""}`} aria-labelledby="callback-title">
        <aside className="auth-story" aria-label="About Gamerie"><div className="auth-story__copy"><h1>Your game life,<br /><span>connected.</span></h1><p>Build a credible gaming identity, find your people, and move from playing to belonging.</p></div></aside>
        <section className={`auth-panel${state === "profile" ? " auth-panel--register" : " auth-process"}`}>
          {state === "working" && <><span className="auth-process__loader" aria-hidden="true" /><h2 id="callback-title">Completing sign in.</h2><p>Connecting your account securely.</p></>}
          {state === "failed" && <><AlertCircle className="auth-process__error-mark" size={20} /><h2 id="callback-title">Sign in not completed.</h2><p>{callbackError}</p><Link className="auth-submit auth-process__action" to="/login">Try again <ArrowRight size={17} /></Link></>}
          {state === "profile" && <>
            <div className="auth-panel__header"><h2 id="callback-title">Complete your profile.</h2><p>Choose how you want to show up across Gamerie.</p></div>
            <form className="auth-form" onSubmit={submitProfile} noValidate>
              {callbackError && <div className="auth-error" role="alert"><AlertCircle size={17} /><p><strong>Profile not saved</strong>{callbackError}</p></div>}
              <div className="auth-field" data-invalid={Boolean(errors.username)}><label htmlFor="social-username">Username</label><input id="social-username" autoComplete="username" placeholder="Choose a username" {...register("username")} />{errors.username && <small role="alert">{errors.username.message}</small>}</div>
              <div className="auth-field" data-invalid={Boolean(errors.gamerTitle)}><label htmlFor="social-gamer-title">What best describes you?</label><select id="social-gamer-title" defaultValue="" {...register("gamerTitle")}><option value="" disabled>Select one</option>{titles.map((title) => <option key={title}>{title}</option>)}</select>{errors.gamerTitle && <small role="alert">{errors.gamerTitle.message}</small>}</div>
              <div className="auth-field" data-invalid={Boolean(errors.gameLevel)}><label htmlFor="social-game-level">Gaming level</label><select id="social-game-level" defaultValue="" {...register("gameLevel")}><option value="" disabled>Select one</option>{levels.map((level) => <option key={level}>{level}</option>)}</select>{errors.gameLevel && <small role="alert">{errors.gameLevel.message}</small>}</div>
              <fieldset className="auth-platforms"><legend>Platforms</legend><div>{platforms.map((platform) => <label key={platform}><input type="checkbox" value={platform} {...register("platforms")} /><span>{platform}</span></label>)}</div>{errors.platforms && <small role="alert">{errors.platforms.message}</small>}</fieldset>
              <button className="auth-submit" type="submit" disabled={isSubmitting}>{isSubmitting ? <><i className="auth-submit__loader" />Saving profile…</> : <>Continue to Gamerie <ArrowRight size={17} /></>}</button>
            </form>
          </>}
        </section>
      </section>
    </main>
  );
}
