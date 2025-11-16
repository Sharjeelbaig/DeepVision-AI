import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import Webcam from "react-webcam";

import "../../styles/authentication.css";
import { register as registerApi, addFace } from "../../services/api";

export default function Register() {
  const navigate = useNavigate();
  const webcamRef = useRef<Webcam>(null);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [captureEnabled, setCaptureEnabled] = useState(false);
  const [capturedFace, setCapturedFace] = useState<string | null>(null);
  const [faceStatus, setFaceStatus] = useState<string | null>(null);
  const [isSavingFace, setIsSavingFace] = useState(false);

  const toggleCapture = () => {
    setCaptureEnabled((previous) => {
      const nextValue = !previous;
      if (!nextValue) {
        setCapturedFace(null);
        setFaceStatus(null);
      }
      return nextValue;
    });
  };

  const captureFrame = () => {
    if (!webcamRef.current) {
      setFaceStatus("Camera is still starting. Please wait a moment.");
      return;
    }
    const frame = webcamRef.current.getScreenshot();
    if (!frame) {
      setFaceStatus("Unable to capture frame. Please try again.");
      return;
    }
    setCapturedFace(frame);
    setFaceStatus("Frame captured. Finish signup to store it.");
  };

  const attemptFaceEnrollment = async (emailAddress: string) => {
    if (!captureEnabled) {
      return;
    }
    if (!capturedFace) {
      setFaceStatus("Capture a frame before finishing signup.");
      return;
    }
    setIsSavingFace(true);
    setFaceStatus("Saving captured face...");
    try {
      const response = await addFace(emailAddress, capturedFace);
      setFaceStatus(response.success ? "Face stored for verification." : response.error ?? "Unable to store face.");
    } catch (error) {
      setFaceStatus(error instanceof Error ? error.message : "Failed to store face.");
    } finally {
      setIsSavingFace(false);
    }
  };

  const handleSignup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email || !password || !name) {
      setMessage("Please complete all required fields.");
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await registerApi({
        email,
        password,
        name,
        bio,
      });
      if (response.success) {
        await attemptFaceEnrollment(email);
        setMessage("Account created! Redirecting to login...");
        setTimeout(() => navigate("/"), 1200);
      } else {
        setMessage(response.error ?? "Unable to create account");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Signup failed");
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
      <form className="w-full" onSubmit={handleSignup}>
        <input
          type="text"
          placeholder="Full Name"
          className="input"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Bio (optional)"
          className="input"
          value={bio}
          onChange={(event) => setBio(event.target.value)}
        />
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
        <div className="face-register-section">
          <div className="face-register-header">
            <div>
              <p className="face-register-eyebrow">Optional</p>
              <h3>Capture face for faster entry</h3>
              <p className="face-register-hint">Enroll a frame now to skip manual uploads later.</p>
            </div>
            <label className="face-toggle">
              <input type="checkbox" checked={captureEnabled} onChange={toggleCapture} />
              <span>{captureEnabled ? "Enabled" : "Enable"}</span>
            </label>
          </div>
          {captureEnabled ? (
            <>
              <div className="face-capture-grid">
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  screenshotFormat="image/jpeg"
                  className="face-webcam"
                />
                <div className="face-preview">
                  {capturedFace ? (
                    <img src={capturedFace} alt="Captured face preview" />
                  ) : (
                    <p>Captured frame will appear here.</p>
                  )}
                </div>
              </div>
              <div className="face-actions">
                <button type="button" className="outline-button" onClick={captureFrame}>
                  Capture Frame
                </button>
                <button
                  type="button"
                  className="text-button"
                  onClick={() => setCapturedFace(null)}
                  disabled={!capturedFace}
                >
                  Clear Capture
                </button>
              </div>
              {faceStatus ? <p className="status-text face-status">{faceStatus}</p> : null}
            </>
          ) : (
            <p className="face-register-hint">Toggle on to enroll your face using your webcam.</p>
          )}
        </div>
        <button className="submit-button" type="submit" disabled={isLoading || isSavingFace}>
          {isLoading ? "Creating account..." : isSavingFace ? "Saving face..." : "Signup"}
        </button>
        {message ? <p className="status-text">{message}</p> : null}
      </form>
      <Link to="/" className="redirect-link">
        I already have an account
      </Link>
    </div>
  );
}
