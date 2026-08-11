import { useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { websiteLinks } from "../../links";
import {
  COOKIE_SETTINGS_EVENT,
  readCookieConsent,
} from "../../privacy/consent";
import {
  earlyBenefits,
  faqs,
  features,
  industryStats,
  roles,
  testimonials,
} from "./landing-content";
import { WaitlistForm } from "./WaitlistForm";

const reveal = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0 },
};

function Brand() {
  return (
    <a className="marketing-brand" href="#top" aria-label="Gamerie home">
      <img src="/gamerie-logo.svg" alt="" />
      <strong>Gamerie</strong>
    </a>
  );
}

function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="marketing-header">
      <Brand />
      <button
        className="marketing-menu-button"
        type="button"
        aria-expanded={open}
        aria-controls="marketing-navigation"
        onClick={() => setOpen((current) => !current)}
      >
        <span />
        <span />
        <span className="sr-only">Open navigation</span>
      </button>
      <div
        className="marketing-header__navigation"
        data-open={open || undefined}
        id="marketing-navigation"
      >
        <nav aria-label="Website navigation">
          <a href="#platform" onClick={() => setOpen(false)}>
            Platform
          </a>
          <a href="#network" onClick={() => setOpen(false)}>
            Who it is for
          </a>
          <a href="#early-access" onClick={() => setOpen(false)}>
            Early access
          </a>
          <a href="#faq" onClick={() => setOpen(false)}>
            FAQ
          </a>
        </nav>
        <div className="marketing-header__actions">
          <a href={`${websiteLinks.app}/login`}>Sign in</a>
          <a
            className="marketing-button"
            href="#join"
            onClick={() => setOpen(false)}
          >
            Join the waitlist <span aria-hidden="true">↗</span>
          </a>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  const reduceMotion = useReducedMotion();
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const imageY = useTransform(
    scrollYProgress,
    [0, 1],
    [0, reduceMotion ? 0 : 72],
  );
  const copyY = useTransform(
    scrollYProgress,
    [0, 1],
    [0, reduceMotion ? 0 : 34],
  );

  return (
    <section className="landing-hero" id="top" ref={heroRef}>
      <motion.div
        className="landing-hero__image"
        style={{ y: imageY }}
        aria-hidden="true"
      >
        <img src="/media/competition-stage.jpg" alt="" />
      </motion.div>
      <div className="landing-hero__shade" aria-hidden="true" />
      <motion.div
        className="landing-hero__content"
        initial="hidden"
        animate="visible"
        transition={{ staggerChildren: 0.1 }}
        style={{ y: copyY }}
      >
        <motion.p className="section-kicker" variants={reveal}>
          The verified platform for competitive gamers
        </motion.p>
        <motion.h1 variants={reveal}>
          Your game life.
          <span>One verified place.</span>
        </motion.h1>
        <motion.p className="landing-hero__lead" variants={reveal}>
          Build a credible gaming identity, find the right people, grow with
          your team, and let every result become part of a story that is
          actually yours.
        </motion.p>
        <motion.div variants={reveal}>
          <WaitlistForm id="hero-waitlist" />
        </motion.div>
        <motion.div className="landing-hero__proof" variants={reveal}>
          <span>Free core experience</span>
          <span>Early access in stages</span>
          <span>Built with gaming communities</span>
        </motion.div>
      </motion.div>
      <a className="landing-hero__scroll" href="#platform">
        Explore Gamerie <span aria-hidden="true">↓</span>
      </a>
    </section>
  );
}

function PlatformSection() {
  return (
    <section className="landing-section platform-section" id="platform">
      <motion.div
        className="section-heading section-heading--split"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={reveal}
      >
        <div>
          <p className="section-kicker">The platform</p>
          <h2>Everything that matters, connected around the player.</h2>
        </div>
        <p>
          Gamerie replaces scattered profiles, disconnected communities, and
          isolated results with a single network that understands how gaming
          lives actually grow.
        </p>
      </motion.div>

      <div className="platform-grid">
        {features.map((feature, index) => (
          <motion.article
            key={feature.title}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.35 }}
            transition={{ delay: index * 0.06 }}
            variants={reveal}
          >
            <span>{feature.index}</span>
            <h3>{feature.title}</h3>
            <p>{feature.description}</p>
          </motion.article>
        ))}
      </div>
    </section>
  );
}

function RolesSection() {
  const [activeRole, setActiveRole] = useState(0);

  return (
    <section className="landing-section roles-section" id="network">
      <div className="roles-section__visual">
        <img
          src="/media/player-community.jpg"
          alt="Players sharing a game together"
          loading="lazy"
        />
        <div>
          <p className="section-kicker">A network for the whole ecosystem</p>
          <strong>
            Different ambitions.
            <br />
            One place to move forward.
          </strong>
        </div>
      </div>
      <div className="roles-list">
        {roles.map((role, index) => (
          <motion.button
            type="button"
            key={role.label}
            aria-expanded={activeRole === index}
            data-active={activeRole === index || undefined}
            onClick={() => setActiveRole(index)}
            onMouseEnter={() => setActiveRole(index)}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            transition={{ delay: index * 0.05 }}
            variants={reveal}
          >
            <span>0{index + 1}</span>
            <div>
              <small>{role.label}</small>
              <h3>{role.title}</h3>
              <AnimatePresence initial={false}>
                {activeRole === index ? (
                  <motion.p
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                  >
                    {role.description}
                  </motion.p>
                ) : null}
              </AnimatePresence>
            </div>
          </motion.button>
        ))}
      </div>
    </section>
  );
}

function ProductSection() {
  const [marketingAllowed, setMarketingAllowed] = useState(
    () => readCookieConsent()?.marketing ?? false,
  );

  useEffect(() => {
    const refreshConsent = () =>
      setMarketingAllowed(readCookieConsent()?.marketing ?? false);
    window.addEventListener("gamerie:consent-changed", refreshConsent);
    return () =>
      window.removeEventListener("gamerie:consent-changed", refreshConsent);
  }, []);

  return (
    <section className="landing-section product-section">
      <div className="product-section__copy">
        <p className="section-kicker">Your command centre</p>
        <h2>One calm surface for the work behind your game.</h2>
        <p>
          Profiles, teams, hubs, messaging, competition, schedules, rankings,
          and opportunity work as one system—not another pile of disconnected
          tools.
        </p>
        <div className="product-credentials">
          <strong>KAMK</strong>
          <p>
            Grounded in research and real esports experience from Kajaani
            University of Applied Sciences in Finland.
          </p>
          <a href={websiteLinks.kamkProof} target="_blank" rel="noreferrer">
            View the academic context <span aria-hidden="true">↗</span>
          </a>
        </div>
      </div>
      <motion.div
        className="product-demo"
        initial={{ opacity: 0, scale: 0.985 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, amount: 0.25 }}
      >
        {marketingAllowed ? (
          <iframe
            src={websiteLinks.demoVideo}
            title="Gamerie platform overview"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          <div className="product-demo__consent">
            <span aria-hidden="true">▶</span>
            <h3>See Gamerie in motion.</h3>
            <p>
              The product video loads only when marketing cookies are enabled.
            </p>
            <button
              type="button"
              onClick={() =>
                window.dispatchEvent(new Event(COOKIE_SETTINGS_EVENT))
              }
            >
              Review cookie choices
            </button>
          </div>
        )}
      </motion.div>
    </section>
  );
}

function EarlyAccessSection() {
  return (
    <section className="landing-section early-section" id="early-access">
      <div className="early-section__heading">
        <p className="section-kicker">Why join early</p>
        <h2>Help shape the network you wish gaming already had.</h2>
        <p>
          The first 30,000 members get closer access to the product, the
          community, and selected launch benefits as Gamerie grows.
        </p>
        <a className="text-link" href="#join">
          Reserve your place <span aria-hidden="true">→</span>
        </a>
      </div>
      <div className="early-benefits">
        {earlyBenefits.map(([title, description], index) => (
          <motion.article
            key={title}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            transition={{ delay: index * 0.045 }}
            variants={reveal}
          >
            <span>0{index + 1}</span>
            <div>
              <h3>{title}</h3>
              <p>{description}</p>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
}

function IndustrySection() {
  return (
    <section className="industry-section">
      <div className="industry-section__image">
        <img
          src="/media/player-performance.jpg"
          alt="Competitive gaming performance"
          loading="lazy"
        />
      </div>
      <div className="industry-section__content">
        <p className="section-kicker">
          A serious industry deserves serious infrastructure
        </p>
        <h2>Gaming has the scale. Players need the system around it.</h2>
        <div className="industry-stats">
          {industryStats.map(([value, label]) => (
            <div key={label}>
              <strong>{value}</strong>
              <span>{label}</span>
            </div>
          ))}
        </div>
        <small>
          Industry figures are directional context drawn from publicly reported
          esports market and event data.
        </small>
      </div>
    </section>
  );
}

function ProofSection() {
  return (
    <section className="landing-section proof-section">
      <div className="section-heading section-heading--split">
        <div>
          <p className="section-kicker">Built with people inside gaming</p>
          <h2>Credibility starts with listening.</h2>
        </div>
        <p>
          Players, researchers, media, and technology leaders have all helped
          sharpen the problem Gamerie is here to solve.
        </p>
      </div>
      <div className="proof-grid">
        {testimonials.map((item, index) => (
          <motion.blockquote
            key={item.name}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            transition={{ delay: index * 0.06 }}
            variants={reveal}
          >
            <p>“{item.quote}”</p>
            <footer>
              <strong>{item.name}</strong>
              <span>{item.detail}</span>
            </footer>
          </motion.blockquote>
        ))}
      </div>
    </section>
  );
}

function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  return (
    <section className="landing-section faq-section" id="faq">
      <div className="faq-section__heading">
        <p className="section-kicker">Questions, answered</p>
        <h2>Before you join.</h2>
      </div>
      <div className="faq-list">
        {faqs.map((item, index) => {
          const open = openIndex === index;
          return (
            <article key={item.question} data-open={open || undefined}>
              <button
                type="button"
                aria-expanded={open}
                onClick={() => setOpenIndex(open ? null : index)}
              >
                <span>{item.question}</span>
                <i aria-hidden="true">{open ? "−" : "+"}</i>
              </button>
              <AnimatePresence initial={false}>
                {open ? (
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
    <section className="final-cta" id="join">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.4 }}
        variants={reveal}
      >
        <p className="section-kicker">Early access</p>
        <h2>Your next chapter in gaming should not live in fragments.</h2>
        <p>
          Reserve your place, meet the community, and help build Gamerie with
          us.
        </p>
        <WaitlistForm compact id="footer-waitlist" />
        <a
          href={websiteLinks.discord}
          target="_blank"
          rel="noreferrer"
          className="text-link"
        >
          Join the Discord community <span aria-hidden="true">↗</span>
        </a>
      </motion.div>
    </section>
  );
}

function Footer() {
  const socials = [
    ["Instagram", websiteLinks.social.instagram],
    ["YouTube", websiteLinks.social.youtube],
    ["X", websiteLinks.social.x],
    ["LinkedIn", websiteLinks.social.linkedin],
  ].filter(([, href]) => href !== "#");

  return (
    <footer className="marketing-footer" id="partners">
      <div className="marketing-footer__lead">
        <Brand />
        <p>Play. Connect. Belong.</p>
      </div>
      <div className="marketing-footer__links">
        <div>
          <strong>Platform</strong>
          <a href="#platform">What Gamerie does</a>
          <a href="#network">Who it is for</a>
          <a href="#early-access">Early access</a>
        </div>
        <div>
          <strong>Community</strong>
          <a href={websiteLinks.discord} target="_blank" rel="noreferrer">
            Discord
          </a>
          <a href={websiteLinks.partners}>Founding partners</a>
          {socials.map(([label, href]) => (
            <a key={label} href={href} target="_blank" rel="noreferrer">
              {label}
            </a>
          ))}
        </div>
        <div>
          <strong>Legal</strong>
          <a href={websiteLinks.terms}>Terms</a>
          <a href={websiteLinks.privacy}>Privacy</a>
          <a href={websiteLinks.cookie}>Cookie policy</a>
          <a href={websiteLinks.communityGuidelines}>Community guidelines</a>
          <a href={websiteLinks.minorsPolicy}>Minors policy</a>
          <button
            type="button"
            onClick={() =>
              window.dispatchEvent(new Event(COOKIE_SETTINGS_EVENT))
            }
          >
            Cookie settings
          </button>
        </div>
      </div>
      <div className="marketing-footer__bottom">
        <span>© {new Date().getFullYear()} Gamerie. All rights reserved.</span>
        <a href={`${websiteLinks.app}/login`}>
          Member sign in <span aria-hidden="true">↗</span>
        </a>
      </div>
    </footer>
  );
}

export function LandingPage() {
  return (
    <div className="marketing-shell">
      <Header />
      <main>
        <Hero />
        <PlatformSection />
        <RolesSection />
        <ProductSection />
        <EarlyAccessSection />
        <IndustrySection />
        <ProofSection />
        <FAQSection />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
