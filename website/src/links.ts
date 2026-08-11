function normalizePublicUrl(value: string | undefined, fallback: string) {
  const candidate = value?.trim();
  if (!candidate) return fallback;
  if (candidate.startsWith("/")) return candidate;
  if (/^https?:\/\//i.test(candidate)) return candidate;
  return `https://${candidate}`;
}

export const websiteLinks = {
  app: normalizePublicUrl(
    import.meta.env.VITE_APP_URL,
    import.meta.env.DEV ? "http://localhost:5174" : "https://app.gamerie.gg",
  ).replace(/\/+$/, ""),
  terms: normalizePublicUrl(
    import.meta.env.VITE_TERMS_OF_SERVICE,
    "https://gameriedevelopment.github.io/Terms-of-service/",
  ),
  privacy: normalizePublicUrl(
    import.meta.env.VITE_PRIVACY_POLICY,
    "https://gameriedevelopment.github.io/Privacy-policy/",
  ),
  cookie: normalizePublicUrl(
    import.meta.env.VITE_COOKIE_POLICY,
    "https://gameriedevelopment.github.io/Cookie-policy/",
  ),
};
