import { useEffect, useState } from "react";
import { websiteLinks } from "../links";
import { applyAnalyticsConsent, trackPageView } from "./analytics";
import {
  COOKIE_SETTINGS_EVENT,
  persistCookieConsent,
  readCookieConsent,
  type CookieConsentChoice,
} from "./consent";
import "./privacy.css";

type DraftConsent = Pick<CookieConsentChoice, "analytics" | "marketing">;

export function CookieConsent() {
  const [consent, setConsent] = useState(readCookieConsent);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [draft, setDraft] = useState<DraftConsent>({
    analytics: consent?.analytics ?? false,
    marketing: consent?.marketing ?? false,
  });

  useEffect(() => {
    const openPreferences = () => {
      const current = readCookieConsent();
      setDraft({
        analytics: current?.analytics ?? false,
        marketing: current?.marketing ?? false,
      });
      setPreferencesOpen(true);
    };
    window.addEventListener(COOKIE_SETTINGS_EVENT, openPreferences);
    return () =>
      window.removeEventListener(COOKIE_SETTINGS_EVENT, openPreferences);
  }, []);

  useEffect(() => {
    if (!preferencesOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPreferencesOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [preferencesOpen]);

  const save = (next: DraftConsent) => {
    const stored = persistCookieConsent(next);
    setConsent(stored);
    setDraft(next);
    setPreferencesOpen(false);
    applyAnalyticsConsent(stored);
    window.dispatchEvent(new Event("gamerie:consent-changed"));
    if (stored.analytics) trackPageView();
  };

  return (
    <>
      {!consent && !preferencesOpen ? (
        <aside
          className="cookie-banner"
          role="region"
          aria-label="Cookie choices"
        >
          <div>
            <strong>Your privacy, your choice.</strong>
            <p>
              Gamerie uses necessary cookies to keep the experience secure. With
              your permission, analytics cookies help us understand and improve
              the platform.
            </p>
            <a href={websiteLinks.cookie}>Read the Cookie Policy</a>
          </div>
          <div className="cookie-banner__actions">
            <button
              type="button"
              onClick={() => save({ analytics: false, marketing: false })}
            >
              Reject non-essential
            </button>
            <button type="button" onClick={() => setPreferencesOpen(true)}>
              Manage
            </button>
            <button
              className="is-primary"
              type="button"
              onClick={() => save({ analytics: true, marketing: true })}
            >
              Accept all
            </button>
          </div>
        </aside>
      ) : null}

      {preferencesOpen ? (
        <div className="cookie-dialog-backdrop" role="presentation">
          <section
            className="cookie-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cookie-dialog-title"
          >
            <header>
              <div>
                <p>Privacy controls</p>
                <h2 id="cookie-dialog-title">Cookie preferences</h2>
              </div>
              <button
                type="button"
                aria-label="Close cookie preferences"
                onClick={() => setPreferencesOpen(false)}
              >
                ×
              </button>
            </header>
            <div className="cookie-dialog__choices">
              <article>
                <div>
                  <strong>Necessary</strong>
                  <p>Required for security and core website functionality.</p>
                </div>
                <span>Always on</span>
              </article>
              <label>
                <div>
                  <strong>Analytics</strong>
                  <p>Helps us understand usage and improve Gamerie.</p>
                </div>
                <input
                  type="checkbox"
                  checked={draft.analytics}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      analytics: event.target.checked,
                    }))
                  }
                />
              </label>
              <label>
                <div>
                  <strong>Marketing</strong>
                  <p>
                    Allows campaign measurement and relevant promotional
                    tracking.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={draft.marketing}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      marketing: event.target.checked,
                    }))
                  }
                />
              </label>
            </div>
            <footer>
              <a href={websiteLinks.cookie}>Cookie Policy</a>
              <button
                className="is-primary"
                type="button"
                onClick={() => save(draft)}
              >
                Save preferences
              </button>
            </footer>
          </section>
        </div>
      ) : null}
    </>
  );
}
