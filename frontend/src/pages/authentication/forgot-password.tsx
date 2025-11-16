import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";

import "../../styles/authentication.css";
import { resetPassword, sendResetLink } from "../../services/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [redirectTo, setRedirectTo] = useState("");
  const [linkMessage, setLinkMessage] = useState<string | null>(null);
  const [linkLoading, setLinkLoading] = useState(false);

  const [userId, setUserId] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [resetLoading, setResetLoading] = useState(false);

  const handleSendResetLink = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLinkLoading(true);
    setLinkMessage(null);
    try {
      const response = await sendResetLink(email, redirectTo || undefined);
      if (response.success) {
        setLinkMessage("Reset link sent successfully.");
      } else {
        setLinkMessage(response.error ?? "Unable to send reset link.");
      }
    } catch (error) {
      setLinkMessage(error instanceof Error ? error.message : "Failed to send reset link.");
    } finally {
      setLinkLoading(false);
    }
  };

  const handleResetPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!userId || !newPassword) {
      setResetMessage("Both user ID and new password are required.");
      return;
    }
    setResetLoading(true);
    setResetMessage(null);
    try {
      const response = await resetPassword(userId, newPassword);
      if (response.success) {
        setResetMessage("Password updated successfully.");
      } else {
        setResetMessage(response.error ?? "Unable to reset password.");
      }
    } catch (error) {
      setResetMessage(error instanceof Error ? error.message : "Failed to reset password.");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="authentication-main-container">
      <div className="logo-container">
        <h1>DeepVision</h1>
        <img src="/logo.png" alt="DeepVision Logo" className="logo-image" />
      </div>

      <div className="w-full auth-card">
        <h2>Send Reset Link</h2>
        <form onSubmit={handleSendResetLink} className="w-full">
          <input
            type="email"
            placeholder="Account Email"
            className="input"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <input
            type="url"
            placeholder="Redirect URL (optional)"
            className="input"
            value={redirectTo}
            onChange={(event) => setRedirectTo(event.target.value)}
          />
          <button className="submit-button" type="submit" disabled={linkLoading}>
            {linkLoading ? "Sending..." : "Send Reset Email"}
          </button>
          {linkMessage ? <p className="status-text">{linkMessage}</p> : null}
        </form>
      </div>

      <div className="w-full auth-card">
        <h2>Reset Password Manually</h2>
        <form onSubmit={handleResetPassword} className="w-full">
          <input
            type="text"
            placeholder="User ID"
            className="input"
            value={userId}
            onChange={(event) => setUserId(event.target.value)}
            required
          />
          <input
            type="password"
            placeholder="New Password"
            className="input"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            required
          />
          <button className="submit-button" type="submit" disabled={resetLoading}>
            {resetLoading ? "Updating..." : "Reset Password"}
          </button>
          {resetMessage ? <p className="status-text">{resetMessage}</p> : null}
        </form>
      </div>

      <Link to="/" className="redirect-link">
        Back to Login
      </Link>
    </div>
  );
}
