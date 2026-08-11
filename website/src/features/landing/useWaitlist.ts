import { useState, type FormEvent } from "react";
import { websiteLinks } from "../../links";

type WaitlistState = "idle" | "submitting" | "success" | "exists" | "error";

export function useWaitlist() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<WaitlistState>("idle");
  const [message, setMessage] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || state === "submitting") return;

    setState("submitting");
    setMessage("");

    try {
      const response = await fetch(`${websiteLinks.api}/users/join-waitlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail }),
      });
      const payload = (await response.json().catch(() => null)) as {
        data?: { status?: string };
        message?: string;
      } | null;

      if (!response.ok)
        throw new Error(payload?.message || "Unable to join the waitlist.");

      if (payload?.data?.status === "exists") {
        setState("exists");
        setMessage("You are already on the waitlist. We will keep you posted.");
        return;
      }

      setState("success");
      setMessage(
        "Your place is reserved. Check your inbox for what comes next.",
      );
      setEmail("");
      window.history.pushState({}, "", "/thank-you");
      window.dispatchEvent(new PopStateEvent("popstate"));
    } catch (error) {
      setState("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to join right now. Try again.",
      );
    }
  };

  return { email, message, setEmail, state, submit };
}
