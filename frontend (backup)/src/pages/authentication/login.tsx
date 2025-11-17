import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import "../../styles/authentication.css";
import { login as loginApi } from "../../services/api";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email || !password) {
      setMessage("Email and password are required.");
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await loginApi(email, password);
      if (response.success) {
        navigate("/home");
      } else {
        setMessage(response.error ?? "Unable to login. Please try again.");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="authentication-main-container">
      <div className="logo-container">
        <h1>DeepVision</h1>
        <img src="/logo.png" alt="DeepVision Logo" className="logo-image" />
      </div>

      <img src="/cover.png" alt="Cover" className="cover-image" />
      <img src="/logo.png" alt="App Logo" className="cover-image-small" />

      <form className="w-full" onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email"
          className="input"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="input"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        <button className="submit-button" type="submit" disabled={isLoading}>
          {isLoading ? "Signing in..." : "Login"}
        </button>
        {message ? <p className="status-text">{message}</p> : null}
      </form>

      <div className="row justify-between w-full">
        <Link to="/register" className="redirect-link">
          Create a new account
        </Link>
        <Link to="/forgot-password" className="redirect-link">
          Forgot Password?
        </Link>
      </div>
    </div>
  );
}
