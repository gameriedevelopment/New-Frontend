export type CookieConsentChoice = {
  version: 1;
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  updatedAt: string;
};

const COOKIE_NAME = "gamerie_consent_v1";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 180;

function consentCookieDomain() {
  const hostname = window.location.hostname;
  return hostname === "gamerie.gg" || hostname.endsWith(".gamerie.gg")
    ? "; Domain=.gamerie.gg"
    : "";
}

export function readCookieConsent(): CookieConsentChoice | null {
  const value = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${COOKIE_NAME}=`))
    ?.slice(COOKIE_NAME.length + 1);
  if (!value) return null;

  try {
    const parsed = JSON.parse(
      decodeURIComponent(value),
    ) as Partial<CookieConsentChoice>;
    if (
      parsed.version !== 1 ||
      typeof parsed.analytics !== "boolean" ||
      typeof parsed.marketing !== "boolean"
    )
      return null;
    return {
      version: 1,
      necessary: true,
      analytics: parsed.analytics,
      marketing: parsed.marketing,
      updatedAt:
        typeof parsed.updatedAt === "string"
          ? parsed.updatedAt
          : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function persistCookieConsent(
  choice: Pick<CookieConsentChoice, "analytics" | "marketing">,
) {
  const consent: CookieConsentChoice = {
    version: 1,
    necessary: true,
    analytics: choice.analytics,
    marketing: choice.marketing,
    updatedAt: new Date().toISOString(),
  };
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(JSON.stringify(consent))}; Path=/; Max-Age=${MAX_AGE_SECONDS}; SameSite=Lax${secure}${consentCookieDomain()}`;
  return consent;
}

export const COOKIE_SETTINGS_EVENT = "gamerie:open-cookie-settings";
