import { Check, Coins } from "lucide-react";
import { useRef, useState } from "react";
import { Button, SkeletonText } from "../../../components/ui";
import { getApiErrorMessage } from "../../../lib/errors";
import { ProfileDialog } from "../../profile/components/interactions/ProfileDialog";
import { usePaymentMethods, usePurchaseTokens } from "../hooks";
import { formatToken } from "../utils";

function purchaseKey() {
  const value =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `wallet-purchase-${value}`;
}

export function PurchaseDialog({ onClose }: { onClose: () => void }) {
  const methods = usePaymentMethods();
  const purchase = usePurchaseTokens();
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<"USD" | "EUR">("USD");
  const [methodId, setMethodId] = useState("");
  const [complete, setComplete] = useState(false);
  const key = useRef(purchaseKey());
  const fiat = Number(amount);
  const glk = Number.isFinite(fiat) ? fiat * 1000 : 0;
  const submit = async () => {
    if (!methodId || fiat < 1 || fiat > 10_000) return;
    await purchase.mutateAsync({
      amount: fiat,
      currency,
      paymentMethodId: methodId,
      idempotencyKey: key.current,
    });
    setComplete(true);
  };
  return (
    <ProfileDialog
      title={complete ? "Purchase complete" : "Purchase GLK"}
      onClose={() => !purchase.isPending && onClose()}
    >
      <div className="wallet-purchase">
        {complete ? (
          <div className="wallet-purchase__receipt">
            <span>
              <Check size={22} />
            </span>
            <p>Purchase completed</p>
            <h3>{formatToken(glk)} GLK has been added to your wallet.</h3>
            <Button onClick={onClose}>Done</Button>
          </div>
        ) : (
          <>
            <p className="wallet-purchase__intro">
              Choose a saved payment method and review the conversion before confirming.
            </p>
            {methods.isLoading ? (
              <SkeletonText lines={3} />
            ) : methods.isError ? (
              <p className="wallet-transfer__error" role="alert">
                Saved payment methods could not be loaded.
              </p>
            ) : methods.data?.length ? (
              <>
                <label className="wallet-purchase__field">
                  <span>Payment method</span>
                  <select value={methodId} onChange={(event) => setMethodId(event.target.value)}>
                    <option value="">Choose a saved method</option>
                    {methods.data.map((method) => (
                      <option value={method.id} key={method.id}>
                        {method.brand} •••• {method.lastFour}
                        {method.isDefault ? " · Default" : ""}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="wallet-purchase__pair">
                  <label className="wallet-purchase__field">
                    <span>Amount</span>
                    <input
                      type="number"
                      min="1"
                      max="10000"
                      step="0.01"
                      inputMode="decimal"
                      value={amount}
                      onChange={(event) => setAmount(event.target.value)}
                      placeholder="0.00"
                    />
                  </label>
                  <label className="wallet-purchase__field">
                    <span>Currency</span>
                    <select
                      value={currency}
                      onChange={(event) => setCurrency(event.target.value as "USD" | "EUR")}
                    >
                      <option>USD</option>
                      <option>EUR</option>
                    </select>
                  </label>
                </div>
                <div className="wallet-purchase__conversion">
                  <Coins size={16} />
                  <span>You receive</span>
                  <strong>{formatToken(glk)} GLK</strong>
                  <small>1 {currency} = 1,000 GLK</small>
                </div>
                {purchase.isError ? (
                  <p className="wallet-transfer__error" role="alert">
                    {getApiErrorMessage(purchase.error, "The purchase could not be completed.")}
                  </p>
                ) : null}
                <footer>
                  <Button variant="quiet" disabled={purchase.isPending} onClick={onClose}>
                    Cancel
                  </Button>
                  <Button
                    disabled={!methodId || fiat < 1 || fiat > 10_000 || purchase.isPending}
                    onClick={() => void submit()}
                  >
                    {purchase.isPending ? "Processing safely…" : "Confirm purchase"}
                  </Button>
                </footer>
              </>
            ) : (
              <div className="wallet-purchase__empty">
                <strong>No saved payment method</strong>
                <p>
                  Secure card setup will open with the wallet launch. Raw card details are never
                  collected by Gamerie.
                </p>
                <Button variant="secondary" onClick={onClose}>
                  Close
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </ProfileDialog>
  );
}
