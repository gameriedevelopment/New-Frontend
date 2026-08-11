import {
  CardCvcElement,
  CardExpiryElement,
  CardNumberElement,
  Elements,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe, type StripeCardNumberElementOptions } from "@stripe/stripe-js";
import { CreditCard } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { Button } from "../../../components/ui";
import { getApiErrorMessage } from "../../../lib/errors";
import { ProfileDialog } from "../../profile/components/interactions/ProfileDialog";
import { useAddPaymentMethod } from "../hooks";

const appearance: StripeCardNumberElementOptions = {
  style: {
    base: {
      color: "#f4f1fb",
      fontFamily: "Manrope, sans-serif",
      fontSize: "14px",
      "::placeholder": { color: "#777280" },
    },
    invalid: { color: "#ef8794" },
  },
};

function PaymentMethodForm({ onClose }: { onClose: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const add = useAddPaymentMethod();
  const [name, setName] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [stripeError, setStripeError] = useState("");
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const number = elements?.getElement(CardNumberElement);
    if (!stripe || !number || !name.trim()) return;
    setStripeError("");
    const result = await stripe.createPaymentMethod({
      type: "card",
      card: number,
      billing_details: { name: name.trim() },
    });
    if (result.error) {
      setStripeError(result.error.message || "Your card details could not be validated.");
      return;
    }
    try {
      await add.mutateAsync({ paymentMethodToken: result.paymentMethod.id, isDefault });
      onClose();
    } catch {
      // The mutation state renders the recoverable API error without closing the form.
    }
  };
  return (
    <form className="wallet-method-form" onSubmit={(event) => void submit(event)}>
      <p>Card details are tokenized by Stripe and never pass through Gamerie's servers.</p>
      <label>
        <span>Name on card</span>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          autoComplete="cc-name"
          placeholder="Cardholder name"
        />
      </label>
      <label>
        <span>Card number</span>
        <div>
          <CardNumberElement options={appearance} />
        </div>
      </label>
      <div className="wallet-method-form__pair">
        <label>
          <span>Expiry</span>
          <div>
            <CardExpiryElement options={appearance} />
          </div>
        </label>
        <label>
          <span>Security code</span>
          <div>
            <CardCvcElement options={appearance} />
          </div>
        </label>
      </div>
      <label className="wallet-method-form__default">
        <input
          type="checkbox"
          checked={isDefault}
          onChange={(event) => setIsDefault(event.target.checked)}
        />
        <span>Use as my default payment method</span>
      </label>
      {stripeError ? (
        <p className="wallet-transfer__error" role="alert">
          {stripeError}
        </p>
      ) : null}
      {add.isError ? (
        <p className="wallet-transfer__error" role="alert">
          {getApiErrorMessage(add.error, "The payment method could not be saved.")}
        </p>
      ) : null}
      <footer>
        <Button variant="quiet" disabled={add.isPending} onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={!stripe || !elements || !name.trim() || add.isPending}>
          {add.isPending ? "Saving securely…" : "Save payment method"}
        </Button>
      </footer>
    </form>
  );
}

export function PaymentMethodDialog({ onClose }: { onClose: () => void }) {
  const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY?.trim();
  const stripe = useMemo(
    () => (publishableKey ? loadStripe(publishableKey) : null),
    [publishableKey],
  );
  return (
    <ProfileDialog title="Add payment method" onClose={onClose}>
      <div className="wallet-method-dialog">
        {stripe ? (
          <Elements stripe={stripe}>
            <PaymentMethodForm onClose={onClose} />
          </Elements>
        ) : (
          <div className="wallet-purchase__empty">
            <CreditCard size={22} />
            <strong>Stripe is not configured</strong>
            <p>
              Add the Stripe publishable key to this environment before enabling payment-method
              setup.
            </p>
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
          </div>
        )}
      </div>
    </ProfileDialog>
  );
}
