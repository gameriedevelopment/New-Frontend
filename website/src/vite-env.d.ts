/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WEBSITE_URL?: string;
  readonly VITE_APP_URL?: string;
  readonly VITE_TERMS_OF_SERVICE?: string;
  readonly VITE_PRIVACY_POLICY?: string;
  readonly VITE_COOKIE_POLICY?: string;
  readonly VITE_COMMUNITY_GUIDELINES?: string;
  readonly VITE_MINORS_POLICY?: string;
  readonly VITE_DISCORD_INVITE_LINK?: string;
  readonly VITE_PARTNERS_PAGE?: string;
  readonly VITE_KAMK_PROOF?: string;
  readonly VITE_GAMERIE_DEMO_VIDEO?: string;
  readonly VITE_INSTAGRAM?: string;
  readonly VITE_FACEBOOK?: string;
  readonly VITE_YOUTUBE?: string;
  readonly VITE_TIKTOK?: string;
  readonly VITE_TWITTER?: string;
  readonly VITE_LINKEDIN?: string;
  readonly VITE_GTM_ID?: string;
  readonly VITE_GA_MEASUREMENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
