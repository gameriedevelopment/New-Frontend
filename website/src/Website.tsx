import { useEffect, useState } from "react";
import { LandingPage } from "./features/landing/LandingPage";
import { ThankYouPage } from "./features/landing/ThankYouPage";

export function Website() {
  const [pathname, setPathname] = useState(() => window.location.pathname);

  useEffect(() => {
    const syncPath = () => setPathname(window.location.pathname);
    window.addEventListener("popstate", syncPath);
    return () => window.removeEventListener("popstate", syncPath);
  }, []);

  return pathname.replace(/\/+$/, "") === "/thank-you" ? (
    <ThankYouPage />
  ) : (
    <LandingPage />
  );
}
