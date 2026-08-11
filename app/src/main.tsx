import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./styles/index.css";
import "./app.css";
import "./features/auth/auth.css";
import "./app/shell/shell.css";
import "./features/newsfeed/newsfeed.css";
import "./features/messages/messages.css";
import "./features/notifications/notifications.css";
import { App } from "./App";
import { RealtimeBridge } from "./features/messages/RealtimeBridge";
import { CookieConsent } from "./features/privacy/CookieConsent";
import { initializeAnalytics } from "./features/privacy/analytics";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1 },
    mutations: { retry: 0 },
  },
});

const root = document.getElementById("root");

if (!root) throw new Error("App root element was not found");

initializeAnalytics();

createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RealtimeBridge />
      <App />
      <CookieConsent />
    </QueryClientProvider>
  </StrictMode>,
);
