function normalizePublicUrl(value: string | undefined, fallback: string) {
  const candidate = value?.trim();
  if (!candidate) return fallback;
  if (candidate.startsWith("/") || candidate.startsWith("#")) return candidate;
  if (/^https?:\/\//i.test(candidate)) return candidate;
  return `https://${candidate}`;
}

export const websiteLinks = {
  app: normalizePublicUrl(
    import.meta.env.VITE_APP_URL,
    import.meta.env.DEV ? "http://localhost:5173" : "https://app.gamerie.gg",
  ).replace(/\/+$/, ""),
  api: normalizePublicUrl(
    import.meta.env.VITE_API_URL,
    import.meta.env.DEV
      ? "http://localhost:8000/api/v1"
      : "https://api.gamerie.gg/api/v1",
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
  communityGuidelines: normalizePublicUrl(
    import.meta.env.VITE_COMMUNITY_GUIDELINES,
    "https://gameriedevelopment.github.io/Community-guidelines/",
  ),
  minorsPolicy: normalizePublicUrl(
    import.meta.env.VITE_MINORS_POLICY,
    "https://gameriedevelopment.github.io/Minors-policy/",
  ),
  discord: normalizePublicUrl(
    import.meta.env.VITE_DISCORD_INVITE_LINK,
    "https://discord.gg/tKmCVrMw",
  ),
  partners: normalizePublicUrl(import.meta.env.VITE_PARTNERS_PAGE, "#partners"),
  demoVideo: normalizePublicUrl(
    import.meta.env.VITE_GAMERIE_DEMO_VIDEO,
    "https://www.youtube.com/embed/kncaQs8zntI",
  ),
  kamkProof: normalizePublicUrl(
    import.meta.env.VITE_KAMK_PROOF,
    "https://kamk.fi/en/news/kamk-is-number-one-in-finland/",
  ),
  social: {
    instagram: normalizePublicUrl(import.meta.env.VITE_INSTAGRAM, "#"),
    youtube: normalizePublicUrl(import.meta.env.VITE_YOUTUBE, "#"),
    x: normalizePublicUrl(import.meta.env.VITE_TWITTER, "#"),
    linkedin: normalizePublicUrl(import.meta.env.VITE_LINKEDIN, "#"),
  },
};
