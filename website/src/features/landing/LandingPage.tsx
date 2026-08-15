import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState, type ReactNode } from "react";
import { websiteLinks } from "../../links";
import { COOKIE_SETTINGS_EVENT } from "../../privacy/consent";
import { audiences, faqs, platformLayers } from "./landing-content";

const ease = [0.22, 1, 0.36, 1] as const;

function ArrowUpRightIcon() {
  return (
    <svg
      className="directional-icon"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M4 12 12 4M6 4h6v6" />
    </svg>
  );
}

function ArrowDownIcon() {
  return (
    <svg
      className="directional-icon"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M8 2.75v10.5M4.5 9.75 8 13.25l3.5-3.5" />
    </svg>
  );
}

function Brand() {
  return (
    <a className="site-brand" href="#top" aria-label="Gamerie home">
      <img src="/gamerie-logo.svg" alt="" />
      <strong>Gamerie</strong>
    </a>
  );
}

function Reveal({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reducedMotion ? false : { opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: 0.78, ease }}
    >
      {children}
    </motion.div>
  );
}

function Header() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  return (
    <header className="site-header">
      <Brand />
      <button
        className="site-menu"
        type="button"
        aria-label={open ? "Close navigation" : "Open navigation"}
        aria-expanded={open}
        aria-controls="site-navigation"
        onClick={() => setOpen((value) => !value)}
      >
        <span />
        <span />
      </button>
      <div
        className="site-navigation"
        id="site-navigation"
        data-open={open || undefined}
      >
        <nav aria-label="Website navigation">
          <a href="#platform" onClick={() => setOpen(false)}>
            Platform
          </a>
          <a href="#identity" onClick={() => setOpen(false)}>
            Identity
          </a>
          <a href="#community" onClick={() => setOpen(false)}>
            Community
          </a>
          <a href="#competition" onClick={() => setOpen(false)}>
            Competition
          </a>
        </nav>
        <div className="site-navigation__actions">
          <a className="site-sign-in" href={websiteLinks.auth.signIn}>
            Sign in
          </a>
          <a className="button button--primary" href={websiteLinks.auth.register}>
            Create account
            <span aria-hidden="true">
              <ArrowUpRightIcon />
            </span>
          </a>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  const reducedMotion = useReducedMotion();
  const heroFrames = [
    "/media/player-setup.jpg",
    "/media/player-community.jpg",
    "/media/competition-stage.jpg",
  ];
  const [activeFrame, setActiveFrame] = useState(0);

  useEffect(() => {
    if (reducedMotion) return;
    const timer = window.setInterval(() => {
      setActiveFrame((frame) => (frame + 1) % heroFrames.length);
    }, 6200);
    return () => window.clearInterval(timer);
  }, [reducedMotion, heroFrames.length]);

  return (
    <section className="hero" id="top">
      <div className="hero__art" aria-hidden="true">
        <AnimatePresence initial={false} mode="sync">
          <motion.img
            key={heroFrames[activeFrame]}
            src={heroFrames[activeFrame]}
            alt=""
            initial={reducedMotion ? false : { opacity: 0, scale: 1.035 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.25, ease }}
          />
        </AnimatePresence>
        <div className="hero__frame-indicator">
          {heroFrames.map((frame, index) => (
            <span key={frame} data-active={activeFrame === index || undefined} />
          ))}
        </div>
      </div>

      <motion.div
        className="hero__copy"
        initial={reducedMotion ? false : "hidden"}
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
      >
        <motion.p
          className="section-kicker"
          variants={{
            hidden: { opacity: 0, y: 10 },
            visible: { opacity: 1, y: 0 },
          }}
          transition={{ duration: 0.55, ease }}
        >
          Built around the player
        </motion.p>
        <motion.h1
          variants={{
            hidden: { opacity: 0, y: 24 },
            visible: { opacity: 1, y: 0 },
          }}
          transition={{ duration: 0.8, ease }}
        >
          Everything you build through games.
          <span>Finally connected.</span>
        </motion.h1>
        <motion.p
          className="hero__lead"
          variants={{
            hidden: { opacity: 0, y: 16 },
            visible: { opacity: 1, y: 0 },
          }}
          transition={{ duration: 0.68, ease }}
        >
          Gamerie is the social gaming platform that brings your games,
          people, teams, and competitive progress into one identity—built to
          grow with every match.
        </motion.p>
        <motion.div
          className="hero__actions"
          variants={{
            hidden: { opacity: 0, y: 14 },
            visible: { opacity: 1, y: 0 },
          }}
          transition={{ duration: 0.62, ease }}
        >
          <a
            className="button button--primary button--large"
            href={websiteLinks.auth.register}
          >
            Create your identity
            <span aria-hidden="true">
              <ArrowUpRightIcon />
            </span>
          </a>
          <a className="button button--quiet button--large" href={websiteLinks.auth.signIn}>
            Sign in
          </a>
        </motion.div>
      </motion.div>

      <motion.a
        className="hero__scroll"
        href="#platform"
        aria-label="Continue to the Gamerie platform overview"
        initial={reducedMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9, duration: 0.6 }}
      >
        <ArrowDownIcon />
      </motion.a>
    </section>
  );
}

function PlatformSection() {
  return (
    <section className="platform section-shell" id="platform">
      <Reveal className="platform__statement">
        <h2>
          More than another place to post.
          <span>A home for the life you build through games.</span>
        </h2>
      </Reveal>

      <div className="platform-ledger">
        {platformLayers.map((layer) => (
          <Reveal className="platform-row" key={layer.label}>
            <strong>{layer.label}</strong>
            <h3>{layer.title}</h3>
            <p>{layer.copy}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function IdentitySection() {
  const recordItems = [
    ["Games", "The worlds you play in"],
    ["Roles", "How you show up"],
    ["Teams", "Who you build with"],
    ["Results", "What you have earned"],
  ];

  return (
    <section className="identity" id="identity">
      <div className="identity__inner section-shell">
        <Reveal className="identity__copy">
          <h2>Not a bio. A living record of your game life.</h2>
          <p>
            Your Gamerie identity connects the games you play to the roles you
            take, the people you meet, and the progress you make. It becomes
            more credible every time you play, contribute, and compete.
          </p>
          <a className="text-link" href={websiteLinks.auth.register}>
            Start building yours
            <span aria-hidden="true">
              <ArrowUpRightIcon />
            </span>
          </a>
        </Reveal>

        <Reveal className="identity-record">
          <div className="identity-record__masthead">
            <div>
              <p>
                <small>Gamerie identity</small>
                <strong>One player. The complete picture.</strong>
              </p>
            </div>
          </div>
          <div className="identity-record__body">
            {recordItems.map(([label, description]) => (
              <div key={label}>
                <small>{label}</small>
                <strong>{description}</strong>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function CommunitySection() {
  return (
    <section className="community section-shell" id="community">
      <div className="community__image">
        <img
          src="/media/community-gaming-floor.jpg"
          alt="Players sharing a gaming experience together"
          loading="lazy"
        />
      </div>
      <Reveal className="community__copy">
        <h2>Find people you would actually play with again.</h2>
        <p>
          Discover players through shared games, level, region, ambition, and
          what they are looking for next. Less follower theatre. More useful
          connection.
        </p>
        <a className="text-link" href={websiteLinks.auth.register}>
          Enter the player network
          <span aria-hidden="true">
            <ArrowUpRightIcon />
          </span>
        </a>
      </Reveal>
    </section>
  );
}

function AudienceSection() {
  const [active, setActive] = useState(0);
  const current = audiences[active];
  const reducedMotion = useReducedMotion();

  return (
    <section className="audience section-shell">
      <Reveal className="audience__heading">
        <h2>Start as a player. Build whatever comes next.</h2>
      </Reveal>

      <div className="audience-composition">
        <div className="audience-tabs" role="tablist" aria-label="Who Gamerie is for">
          {audiences.map((item, index) => (
            <button
              id={`audience-tab-${index}`}
              type="button"
              role="tab"
              aria-controls="audience-story"
              aria-selected={active === index}
              key={item.label}
              onClick={() => setActive(index)}
            >
              <strong>{item.label}</strong>
            </button>
          ))}
        </div>
        <div
          className="audience-story"
          id="audience-story"
          role="tabpanel"
          aria-labelledby={`audience-tab-${active}`}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={current.label}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.4, ease }}
            >
              <span>{current.label}</span>
              <h3>{current.title}</h3>
              <p>{current.copy}</p>
            </motion.div>
          </AnimatePresence>
          <AnimatePresence initial={false} mode="sync">
            <motion.img
              key={current.image}
              src={current.image}
              alt={current.imageAlt}
              loading="lazy"
              initial={reducedMotion ? false : { opacity: 0, scale: 1.025 }}
              animate={{ opacity: 0.72, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.55, ease }}
            />
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

function CompetitionSection() {
  return (
    <section className="competition" id="competition">
      <div className="competition__image">
        <img
          src="/media/competition-focus.jpg"
          alt="A competitive player preparing at an arena setup"
          loading="lazy"
        />
      </div>
      <div className="competition__inner section-shell">
        <Reveal className="competition__copy">
          <p className="section-kicker">From play to proof</p>
          <h2>The wins matter. So does everything it took to get there.</h2>
          <p>
            Challenges, tournaments, rankings, achievements, and match history
            stay connected to the people and teams behind them.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

function QuestionsSection() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="questions section-shell" id="questions">
      <Reveal className="questions__intro">
        <h2>Start where you are.</h2>
        <p>
          Gamerie is for the person finding a first squad and the player
          building a serious competitive future.
        </p>
      </Reveal>
      <div className="question-list">
        {faqs.map((item, index) => {
          const isOpen = open === index;
          return (
            <article key={item.question} data-open={isOpen || undefined}>
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setOpen(isOpen ? null : index)}
              >
                <span>{item.question}</span>
                <i aria-hidden="true">{isOpen ? "−" : "+"}</i>
              </button>
              <AnimatePresence initial={false}>
                {isOpen ? (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                  >
                    <p>{item.answer}</p>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="final-cta section-shell">
      <img src="/media/gamerie-arena-signal.jpg" alt="" aria-hidden="true" />
      <Reveal>
        <h2>Your player identity starts here.</h2>
        <p>Bring your games, people, teams, and progress into one place.</p>
        <div className="final-cta__actions">
          <a
            className="button button--primary button--large"
            href={websiteLinks.auth.register}
          >
            Create your identity
            <span aria-hidden="true">
              <ArrowUpRightIcon />
            </span>
          </a>
          <a className="button button--quiet button--large" href={websiteLinks.auth.signIn}>
            Sign in
          </a>
        </div>
      </Reveal>
    </section>
  );
}

function Footer() {
  const socials = [
    ["Instagram", websiteLinks.social.instagram],
    ["Facebook", websiteLinks.social.facebook],
    ["YouTube", websiteLinks.social.youtube],
    ["TikTok", websiteLinks.social.tiktok],
    ["X", websiteLinks.social.x],
    ["LinkedIn", websiteLinks.social.linkedin],
  ].filter(([, href]) => href !== "#");

  return (
    <footer className="site-footer">
      <div className="site-footer__brand">
        <Brand />
        <p>Play. Connect. Belong.</p>
      </div>
      <div className="site-footer__links">
        <div>
          <strong>Platform</strong>
          <a href="#platform">What Gamerie does</a>
          <a href="#identity">Player identity</a>
          <a href="#community">Community</a>
          <a href="#competition">Competition</a>
        </div>
        <div>
          <strong>Community</strong>
          <a href={websiteLinks.discord} target="_blank" rel="noreferrer">
            Discord
          </a>
          <a href={websiteLinks.partners}>Partners</a>
          {socials.map(([label, href]) => (
            <a href={href} key={label} target="_blank" rel="noreferrer">
              {label}
            </a>
          ))}
        </div>
        <div>
          <strong>Legal</strong>
          <a href={websiteLinks.terms}>Terms</a>
          <a href={websiteLinks.privacy}>Privacy</a>
          <a href={websiteLinks.cookie}>Cookies</a>
          <a href={websiteLinks.communityGuidelines}>Community guidelines</a>
          <a href={websiteLinks.minorsPolicy}>Minors policy</a>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event(COOKIE_SETTINGS_EVENT))}
          >
            Cookie settings
          </button>
        </div>
      </div>
      <div className="site-footer__bottom">
        <span>© {new Date().getFullYear()} Gamerie</span>
        <span>Made for the people who keep playing.</span>
      </div>
    </footer>
  );
}

export function LandingPage() {
  return (
    <div className="website-shell">
      <Header />
      <main>
        <Hero />
        <PlatformSection />
        <IdentitySection />
        <CommunitySection />
        <AudienceSection />
        <CompetitionSection />
        <QuestionsSection />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
