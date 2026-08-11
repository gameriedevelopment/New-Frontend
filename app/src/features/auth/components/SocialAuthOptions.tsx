import { useState } from "react";
import { beginSocialAuth, type SocialProvider } from "../api";

const providers: Array<{ id: SocialProvider; label: string; iconSrc: string; available: boolean }> =
  [
    { id: "google", label: "Google", iconSrc: "/social/google.png", available: true },
    { id: "facebook", label: "Facebook", iconSrc: "/social/facebook.png", available: true },
    { id: "discord", label: "Discord", iconSrc: "/social/discord.png", available: true },
    { id: "apple", label: "Apple", iconSrc: "/social/apple.png", available: false },
  ];

export function SocialAuthOptions({ mode }: { mode: "signin" | "signup" }) {
  const [activeProvider, setActiveProvider] = useState<SocialProvider | null>(null);

  const continueWith = (provider: SocialProvider) => {
    setActiveProvider(provider);
    beginSocialAuth(provider);
  };

  return (
    <section
      className="auth-social"
      aria-label={`${mode === "signin" ? "Sign in" : "Sign up"} with a connected account`}
    >
      <div className="auth-social__divider">
        <span>or continue with</span>
      </div>
      <div className="auth-social__options">
        {providers.map((provider) => (
          <button
            key={provider.id}
            type="button"
            onClick={() => continueWith(provider.id)}
            disabled={!provider.available || activeProvider !== null}
            aria-label={`${mode === "signin" ? "Sign in" : "Sign up"} with ${provider.label}${provider.available ? "" : ", unavailable"}`}
            title={provider.available ? undefined : "Apple sign in is not available yet"}
          >
            <img src={provider.iconSrc} alt="" />
            <span>{provider.label}</span>
            {activeProvider === provider.id && (
              <i className="auth-social__loader" aria-hidden="true" />
            )}
          </button>
        ))}
      </div>
    </section>
  );
}
