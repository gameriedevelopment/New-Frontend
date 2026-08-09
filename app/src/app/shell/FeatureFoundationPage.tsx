import { useLocation } from "react-router-dom";

const pageNames: Record<string, string> = {
  "/feed": "Feed", "/users": "Discover players", "/games": "Games", "/teams": "Teams", "/hubs": "Hubs", "/messages": "Messages", "/tournaments": "Tournaments", "/leaderboard": "Leaderboard", "/calendar": "Calendar", "/wallet": "Wallet", "/search": "Search", "/notifications": "Notifications", "/settings": "Settings", "/admin": "Admin",
};

export function FeatureFoundationPage() {
  const { pathname } = useLocation();
  const title = pathname.startsWith("/profile/") ? "Profile" : pageNames[pathname] ?? "Gamerie";
  return (
    <section className="feature-foundation" aria-labelledby="feature-title">
      <header><p>Gamerie</p><h1 id="feature-title">{title}</h1></header>
      <div className="feature-foundation__canvas" aria-label={`${title} content area`} />
    </section>
  );
}
