import { motion } from "framer-motion";
import { websiteLinks } from "../../links";

export function ThankYouPage() {
  return (
    <main className="thank-you-page">
      <a className="marketing-brand" href="/" aria-label="Gamerie home">
        <img src="/gamerie-logo.svg" alt="" />
        <strong>Gamerie</strong>
      </a>
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="thank-you-page__mark" aria-hidden="true">
          <span>✓</span>
        </div>
        <p className="section-kicker">Your place is reserved</p>
        <h1>Welcome early.</h1>
        <p>
          Check your inbox and, if you do not see us, take a quick look in spam.
          Product updates and early-access information will arrive there.
        </p>
        <div className="thank-you-page__actions">
          <a
            className="marketing-button"
            href={websiteLinks.discord}
            target="_blank"
            rel="noreferrer"
          >
            Join the Discord community <span aria-hidden="true">↗</span>
          </a>
          <a className="text-link" href="/">
            Back to Gamerie
          </a>
        </div>
        <div className="thank-you-page__notes">
          <span>Product updates</span>
          <span>Community events</span>
          <span>Tester opportunities</span>
        </div>
      </motion.section>
    </main>
  );
}
