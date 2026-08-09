const activity = [
  { action: "won the Grid Series", game: "Valorant", name: "Astra Nine", tone: "violet" },
  { action: "formed a new roster", game: "EA FC", name: "Northstar", tone: "cyan" },
  { action: "reached Diamond", game: "League", name: "Mira", tone: "amber" },
];

export function Website() {
  return (
    <div className="site-shell">
      <header className="site-header">
        <a className="site-brand" href="#top" aria-label="Gamerie home">
          <img src="/gamerie-logo.svg" alt="" />
          <strong>Gamerie</strong>
        </a>

        <nav className="site-nav" aria-label="Website navigation">
          <a href="#platform">Platform</a>
          <a href="#community">Community</a>
          <a href="#competition">Competition</a>
        </nav>

        <div className="site-actions">
          <a href="http://localhost:5174/login">Sign in</a>
          <a className="site-primary-link" href="http://localhost:5174/register">
            Enter Gamerie <span aria-hidden="true">↗</span>
          </a>
        </div>
      </header>

      <main id="top">
        <section className="site-hero" aria-labelledby="hero-title">
          <div className="site-hero__copy">
            <span className="site-kicker"><i /> The social layer for gaming</span>
            <h1 id="hero-title">
              Your game life,
              <em> finally connected.</em>
            </h1>
            <p>
              One living identity for the games you play, the teams you build,
              the people you meet, and the moments that prove you belong.
            </p>
            <div className="site-hero__actions">
              <a className="site-primary-link is-large" href="http://localhost:5174/register">
                Build your player identity <span aria-hidden="true">→</span>
              </a>
              <a className="site-text-link" href="#platform">
                See how Gamerie works <span aria-hidden="true">↓</span>
              </a>
            </div>
          </div>

          <div className="arena-composition" aria-label="A glimpse of activity across Gamerie">
            <div className="arena-composition__field" aria-hidden="true">
              <span /><span /><span />
            </div>
            <div className="arena-card">
              <header>
                <div>
                  <span>Live across Gamerie</span>
                  <strong>Arena pulse</strong>
                </div>
                <i>Live</i>
              </header>
              <div className="arena-card__list">
                {activity.map((item) => (
                  <article key={item.name}>
                    <span className="arena-avatar" data-tone={item.tone}>{item.name.slice(0, 1)}</span>
                    <div>
                      <strong>{item.name}</strong>
                      <p>{item.action}</p>
                    </div>
                    <small>{item.game}</small>
                  </article>
                ))}
              </div>
              <footer>
                <span>Players, teams and games—moving together.</span>
                <b aria-hidden="true">•••</b>
              </footer>
            </div>
          </div>
        </section>

        <section className="site-proof" id="platform" aria-label="Gamerie platform pillars">
          <article>
            <span>01</span>
            <div><strong>Identity</strong><p>Your history, skill, reputation, and game connections in one credible profile.</p></div>
          </article>
          <article id="community">
            <span>02</span>
            <div><strong>Community</strong><p>Find players, grow teams, join hubs, and stay close to the people you play with.</p></div>
          </article>
          <article id="competition">
            <span>03</span>
            <div><strong>Competition</strong><p>Challenge, rank, organize, and turn every result into part of your story.</p></div>
          </article>
        </section>
      </main>
    </div>
  );
}
