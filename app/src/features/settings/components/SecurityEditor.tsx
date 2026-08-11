import Cookies from "js-cookie";
import { useEffect, useState } from "react";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { useNavigate } from "react-router-dom";
import { Button } from "../../../components/ui";
import { getApiErrorMessage } from "../../../lib/errors";
import {
  changePassword,
  checkPhoneCode,
  fetchSmsVerificationEnabled,
  requestEmailChange,
  sendPhoneCode,
  signOut,
  syncUserWithBackend,
} from "../../auth/api";
import { useAuthStore } from "../../auth/authStore";

type SecurityPanel = "password" | "email" | "phone";

export function SecurityEditor() {
  const user = useAuthStore((state) => state.user);
  const clearUser = useAuthStore((state) => state.clearUser);
  const navigate = useNavigate();
  const [panel, setPanel] = useState<SecurityPanel>("password");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [email, setEmail] = useState({ newEmail: "", currentPassword: "" });
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [smsEnabled, setSmsEnabled] = useState(true);
  useEffect(() => {
    void fetchSmsVerificationEnabled().then(setSmsEnabled);
  }, []);
  const select = (next: SecurityPanel) => {
    setPanel(next);
    setError("");
    setSuccess("");
  };

  const updatePassword = async () => {
    setError("");
    setSuccess("");
    if (passwords.newPassword.length < 8)
      return setError("Your new password must contain at least 8 characters.");
    if (passwords.newPassword !== passwords.confirmPassword)
      return setError("The new passwords do not match.");
    try {
      setPending(true);
      await changePassword(
        passwords.currentPassword,
        passwords.newPassword,
        passwords.confirmPassword,
      );
      await signOut().catch(() => {
        Cookies.remove("auth_token");
        clearUser();
      });
      navigate("/login", { replace: true });
    } catch (reason) {
      setError(getApiErrorMessage(reason, "Your password could not be changed."));
    } finally {
      setPending(false);
    }
  };
  const updateEmail = async () => {
    setError("");
    setSuccess("");
    if (!/^\S+@\S+\.\S+$/.test(email.newEmail)) return setError("Enter a valid new email address.");
    try {
      setPending(true);
      await requestEmailChange(email.newEmail.trim(), email.currentPassword);
      setSuccess(
        `A confirmation link was sent to ${email.newEmail.trim()}. Your address will change after you open it.`,
      );
      setEmail({ newEmail: "", currentPassword: "" });
    } catch (reason) {
      setError(getApiErrorMessage(reason, "The email change could not be requested."));
    } finally {
      setPending(false);
    }
  };
  const requestCode = async () => {
    setError("");
    setSuccess("");
    if (!phone || !isValidPhoneNumber(phone))
      return setError("Enter a valid international phone number.");
    try {
      setPending(true);
      await sendPhoneCode(phone);
      setCodeSent(true);
      setSuccess(`A six-digit verification code was sent to ${phone}.`);
    } catch (reason) {
      setError(getApiErrorMessage(reason, "A verification code could not be sent."));
    } finally {
      setPending(false);
    }
  };
  const verifyPhone = async () => {
    setError("");
    setSuccess("");
    if (!phone || !/^\d{6}$/.test(code)) return setError("Enter the six-digit code.");
    try {
      setPending(true);
      await checkPhoneCode(phone, code);
      await syncUserWithBackend();
      setSuccess("Your verified phone number has been updated.");
      setCode("");
      setCodeSent(false);
    } catch (reason) {
      setError(getApiErrorMessage(reason, "That code is invalid or has expired."));
    } finally {
      setPending(false);
    }
  };

  return (
    <section className="settings-form">
      <div className="settings-section-heading">
        <p>Account security</p>
        <h2>Sign-in and verification</h2>
        <span>
          Sensitive changes require your password or a verification code. Password changes end your
          current session.
        </span>
      </div>
      <nav className="security-tabs" aria-label="Security controls">
        <button
          type="button"
          aria-current={panel === "password" ? "page" : undefined}
          onClick={() => select("password")}
        >
          Password
        </button>
        <button
          type="button"
          aria-current={panel === "email" ? "page" : undefined}
          onClick={() => select("email")}
        >
          Email
        </button>
        <button
          type="button"
          aria-current={panel === "phone" ? "page" : undefined}
          onClick={() => select("phone")}
        >
          Phone
        </button>
      </nav>
      {panel === "password" ? (
        <div className="security-panel">
          <header>
            <h3>Change password</h3>
            <p>Choose a unique password you do not use on another service.</p>
          </header>
          <label className="settings-field">
            <span>Current password</span>
            <input
              type="password"
              autoComplete="current-password"
              value={passwords.currentPassword}
              onChange={(event) =>
                setPasswords((current) => ({ ...current, currentPassword: event.target.value }))
              }
            />
          </label>
          <label className="settings-field">
            <span>New password</span>
            <input
              type="password"
              autoComplete="new-password"
              value={passwords.newPassword}
              onChange={(event) =>
                setPasswords((current) => ({ ...current, newPassword: event.target.value }))
              }
            />
            <small>At least 8 characters. Use a mix that is difficult to guess.</small>
          </label>
          <label className="settings-field">
            <span>Confirm new password</span>
            <input
              type="password"
              autoComplete="new-password"
              value={passwords.confirmPassword}
              onChange={(event) =>
                setPasswords((current) => ({ ...current, confirmPassword: event.target.value }))
              }
            />
          </label>
          <Button
            disabled={pending || !passwords.currentPassword || !passwords.newPassword}
            onClick={() => void updatePassword()}
          >
            {pending ? "Updating…" : "Change password"}
          </Button>
        </div>
      ) : null}
      {panel === "email" ? (
        <div className="security-panel">
          <header>
            <h3>Change email address</h3>
            <p>
              Your current address is <strong>{user?.email}</strong>. We will verify the new address
              before replacing it.
            </p>
          </header>
          <label className="settings-field">
            <span>New email address</span>
            <input
              type="email"
              autoComplete="email"
              value={email.newEmail}
              onChange={(event) =>
                setEmail((current) => ({ ...current, newEmail: event.target.value }))
              }
            />
          </label>
          <label className="settings-field">
            <span>Current password</span>
            <input
              type="password"
              autoComplete="current-password"
              value={email.currentPassword}
              onChange={(event) =>
                setEmail((current) => ({ ...current, currentPassword: event.target.value }))
              }
            />
          </label>
          <Button
            disabled={pending || !email.newEmail || !email.currentPassword}
            onClick={() => void updateEmail()}
          >
            {pending ? "Sending…" : "Send confirmation link"}
          </Button>
        </div>
      ) : null}
      {panel === "phone" ? (
        <div className="security-panel">
          <header>
            <h3>{user?.phoneNumber ? "Change phone number" : "Add phone number"}</h3>
            <p>
              {smsEnabled
                ? `Current verified number: ${user?.phoneNumber || "none"}.`
                : "Phone verification is temporarily unavailable."}
            </p>
          </header>
          {smsEnabled ? (
            <>
              <label className="settings-field settings-phone">
                <span>New phone number</span>
                <PhoneInput
                  international
                  defaultCountry="NG"
                  value={phone}
                  onChange={(value) => {
                    setPhone(value || "");
                    setCodeSent(false);
                    setCode("");
                  }}
                />
              </label>
              {codeSent ? (
                <label className="settings-field">
                  <span>Verification code</span>
                  <input
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={code}
                    onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
                    placeholder="000000"
                  />
                </label>
              ) : null}
              <div className="security-panel__actions">
                <Button
                  variant="quiet"
                  disabled={pending || !phone}
                  onClick={() => void requestCode()}
                >
                  {codeSent ? "Send another code" : "Send verification code"}
                </Button>
                {codeSent ? (
                  <Button
                    disabled={pending || code.length !== 6}
                    onClick={() => void verifyPhone()}
                  >
                    {pending ? "Verifying…" : "Verify number"}
                  </Button>
                ) : null}
              </div>
            </>
          ) : null}
        </div>
      ) : null}
      {error ? (
        <p className="settings-error" role="alert">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="settings-success" role="status">
          {success}
        </p>
      ) : null}
    </section>
  );
}
