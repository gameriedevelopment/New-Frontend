import { motion } from "framer-motion";
import { useWaitlist } from "./useWaitlist";

type WaitlistFormProps = {
  compact?: boolean;
  id?: string;
};

export function WaitlistForm({ compact = false, id }: WaitlistFormProps) {
  const { email, message, setEmail, state, submit } = useWaitlist();
  const busy = state === "submitting";

  return (
    <div
      className="waitlist-form-wrap"
      data-compact={compact || undefined}
      id={id}
    >
      <form className="waitlist-form" onSubmit={submit}>
        <label className="sr-only" htmlFor={`${id ?? "waitlist"}-email`}>
          Email address
        </label>
        <input
          autoComplete="email"
          id={`${id ?? "waitlist"}-email`}
          inputMode="email"
          name="email"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          required
          type="email"
          value={email}
        />
        <button disabled={busy} type="submit">
          <span>{busy ? "Reserving your place…" : "Join the waitlist"}</span>
          <span aria-hidden="true">→</span>
        </button>
      </form>
      <div className="waitlist-form__meta">
        <span>No spam. Just access and meaningful updates.</span>
        {message ? (
          <motion.p
            aria-live="polite"
            data-state={state}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {message}
          </motion.p>
        ) : null}
      </div>
    </div>
  );
}
