import { Check, CreditCard, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button, SkeletonText, StatePanel } from "../../../components/ui";
import { getApiErrorMessage } from "../../../lib/errors";
import { useDeletePaymentMethod, usePaymentMethods, useSetDefaultPaymentMethod } from "../hooks";

export function PaymentMethodsPanel({ enabled, onAdd }: { enabled: boolean; onAdd: () => void }) {
  const methods = usePaymentMethods();
  const setDefault = useSetDefaultPaymentMethod();
  const remove = useDeletePaymentMethod();
  const [confirming, setConfirming] = useState<string | null>(null);
  return (
    <section className="wallet-methods" aria-labelledby="wallet-methods-title">
      <header>
        <div>
          <p>Payment methods</p>
          <h2 id="wallet-methods-title">Saved cards</h2>
          <span>Stripe-tokenized methods available for GLK purchases.</span>
        </div>
        <Button size="small" variant="secondary" disabled={!enabled} onClick={onAdd}>
          <Plus size={13} />
          Add method
        </Button>
      </header>
      {methods.isLoading ? (
        <SkeletonText lines={4} />
      ) : methods.isError ? (
        <StatePanel
          tone="error"
          title="Payment methods could not load"
          description={getApiErrorMessage(
            methods.error,
            "Try again when your connection is stable.",
          )}
          action={
            <Button size="small" variant="secondary" onClick={() => methods.refetch()}>
              Retry
            </Button>
          }
        />
      ) : methods.data?.length ? (
        <div className="wallet-method-list">
          {methods.data.map((method) => (
            <article key={method.id}>
              <span>
                <CreditCard size={17} />
              </span>
              <div>
                <strong>
                  {method.brand || "Card"} •••• {method.lastFour}
                </strong>
                <small>
                  Expires {String(method.expiryMonth).padStart(2, "0")}/
                  {String(method.expiryYear).slice(-2)}
                </small>
              </div>
              {method.isDefault ? (
                <b>
                  <Check size={12} />
                  Default
                </b>
              ) : (
                <button
                  type="button"
                  disabled={!enabled || setDefault.isPending}
                  onClick={() => setDefault.mutate(method.id)}
                >
                  Make default
                </button>
              )}
              <button
                type="button"
                className="wallet-method-list__remove"
                data-confirm={confirming === method.id}
                disabled={!enabled || remove.isPending}
                onClick={() =>
                  confirming === method.id
                    ? remove.mutate(method.id, { onSuccess: () => setConfirming(null) })
                    : setConfirming(method.id)
                }
              >
                {confirming === method.id ? (
                  "Confirm remove"
                ) : (
                  <>
                    <Trash2 size={13} />
                    Remove
                  </>
                )}
              </button>
            </article>
          ))}
        </div>
      ) : (
        <div className="wallet-methods__empty">
          <CreditCard size={18} />
          <div>
            <strong>No saved payment methods</strong>
            <p>Add a Stripe-tokenized card when wallet services are enabled.</p>
          </div>
        </div>
      )}
      {setDefault.isError || remove.isError ? (
        <p className="wallet-transfer__error" role="alert">
          {getApiErrorMessage(
            setDefault.error || remove.error,
            "The payment method could not be updated.",
          )}
        </p>
      ) : null}
    </section>
  );
}
