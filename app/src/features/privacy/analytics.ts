import type { CookieConsentChoice } from "./consent";
import { readCookieConsent } from "./consent";

declare global {
  interface Window {
    dataLayer: unknown[];
  }
}

const gtmId = import.meta.env.VITE_GTM_ID?.trim();
const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID?.trim();
let analyticsLoaded = false;
let currentConsent = readCookieConsent();

function gtag(...args: unknown[]) {
  window.dataLayer.push(args);
}

function validId(value: string | undefined, prefix: string) {
  return Boolean(value && value.startsWith(prefix));
}

function loadAnalytics() {
  if (analyticsLoaded || (!currentConsent?.analytics && !currentConsent?.marketing)) return;
  analyticsLoaded = true;

  if (validId(gtmId, "GTM-")) {
    window.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(gtmId!)}`;
    script.dataset.gamerieAnalytics = "gtm";
    document.head.appendChild(script);
    return;
  }

  if (validId(measurementId, "G-")) {
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId!)}`;
    script.dataset.gamerieAnalytics = "ga";
    document.head.appendChild(script);
    gtag("js", new Date());
    gtag("config", measurementId, { send_page_view: false });
  }
}

export function applyAnalyticsConsent(consent: CookieConsentChoice | null) {
  currentConsent = consent;
  window.dataLayer = window.dataLayer || [];
  gtag("consent", consent ? "update" : "default", {
    analytics_storage: consent?.analytics ? "granted" : "denied",
    ad_storage: consent?.marketing ? "granted" : "denied",
    ad_user_data: consent?.marketing ? "granted" : "denied",
    ad_personalization: consent?.marketing ? "granted" : "denied",
    wait_for_update: consent ? 0 : 500,
  });
  loadAnalytics();
}

export function initializeAnalytics() {
  window.dataLayer = window.dataLayer || [];
  applyAnalyticsConsent(currentConsent);
}

export function trackPageView(path: string) {
  if (!currentConsent?.analytics) return;
  window.dataLayer.push({
    event: "virtual_page_view",
    page_location: window.location.href,
    page_path: path,
    page_title: document.title,
  });
  if (!validId(gtmId, "GTM-") && validId(measurementId, "G-")) {
    gtag("event", "page_view", {
      page_location: window.location.href,
      page_path: path,
      page_title: document.title,
    });
  }
}
