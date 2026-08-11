import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/index.css";
import "./website.css";
import { Website } from "./Website";
import { CookieConsent } from "./privacy/CookieConsent";
import { initializeAnalytics, trackPageView } from "./privacy/analytics";

const root = document.getElementById("root");

if (!root) throw new Error("Website root element was not found");

initializeAnalytics();

createRoot(root).render(
  <StrictMode>
    <Website />
    <CookieConsent />
  </StrictMode>,
);

trackPageView();
