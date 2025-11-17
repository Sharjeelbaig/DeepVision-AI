import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import Webcam from "react-webcam";

import "../../styles/live feed.css";
import Card from "../../components/Card";
import { addFace, recognizeFace, getUserProfileByEmail } from "../../services/api";

export default function LiveFeed() {
    const webcamRef = useRef<Webcam>(null);
    const [base64Image, setBase64Image] = useState<string>("");
    const [faceEmail, setFaceEmail] = useState("");
    const [addFaceStatus, setAddFaceStatus] = useState<string | null>(null);
    const [isAddingFace, setIsAddingFace] = useState(false);

    const [recognitionStatus, setRecognitionStatus] = useState<string | null>(null);
    const [recognitionResult, setRecognitionResult] = useState<{ isMatch: boolean; confidence: number } | null>(null);
    const [isRecognizing, setIsRecognizing] = useState(false);
    const [userProfile, setUserProfile] = useState<Record<string, unknown> | null>(null);
    const [profileStatus, setProfileStatus] = useState<string | null>(null);

    const getProfileValue = (field: string, fallback: string) => {
        const value = userProfile?.[field];
        return typeof value === "string" && value.length > 0 ? value : fallback;
    };

    const capture = useCallback(() => {
        const imageSrc = webcamRef.current?.getScreenshot();
        if (imageSrc) {
            setBase64Image(imageSrc);
        }
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            capture();
        }, 1500);
        return () => clearInterval(interval);
    }, [capture]);

    const handleAddFace = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!faceEmail || !base64Image) {
            setAddFaceStatus("Email and a captured frame are required.");
            return;
        }
        setIsAddingFace(true);
        setAddFaceStatus(null);
        try {
            const response = await addFace(faceEmail, base64Image);
            setAddFaceStatus(response.success ? "Face stored successfully." : response.error ?? "Unable to add face.");
        } catch (error) {
            setAddFaceStatus(error instanceof Error ? error.message : "Failed to add face.");
        } finally {
            setIsAddingFace(false);
        }
    };

    const handleRecognize = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!faceEmail) {
            setRecognitionStatus("Provide the email you want to verify.");
            return;
        }
        if (!base64Image) {
            setRecognitionStatus("Waiting for a camera frame. Please stay in view.");
            return;
        }
        setIsRecognizing(true);
        setRecognitionStatus(null);
        setRecognitionResult(null);
        setProfileStatus(null);
        setUserProfile(null);
        try {
            const response = await recognizeFace(faceEmail, base64Image);
            setRecognitionResult({ isMatch: response.isMatch, confidence: response.confidence });

            if (response.isMatch) {
                setRecognitionStatus("Face verified against stored photo.");
                try {
                    const profileResponse = await getUserProfileByEmail(faceEmail);
                    if (profileResponse.data) {
                        setUserProfile(profileResponse.data);
                        setProfileStatus(null);
                    } else {
                        setUserProfile(null);
                        setProfileStatus(profileResponse.error ?? "Profile not found.");
                    }
                } catch (profileError) {
                    setProfileStatus(profileError instanceof Error ? profileError.message : "Failed to load profile.");
                }
            } else {
                setRecognitionStatus("Face did not match the stored record.");
                setProfileStatus("Face mismatch. Cannot display profile data.");
            }
        } catch (error) {
            setRecognitionResult(null);
            setRecognitionStatus(error instanceof Error ? error.message : "Failed to recognize faces.");
        } finally {
            setIsRecognizing(false);
        }
    };

    return (
        <div className="live-feed-page">
            <section className="live-feed-top">
                <article className="user-panel">
                    <header className="user-panel__header">
                        <div>
                            <p className="eyebrow">Currently monitoring</p>
                            <h2>Resident Verification</h2>
                        </div>
                        <span className={`status-dot ${base64Image ? "status-online" : "status-idle"}`}>
                            {base64Image ? "Live" : "Idle"}
                        </span>
                    </header>
                    <div className="user-panel__body">
                        <dl>
                            <div>
                                <dt>Captured Frame</dt>
                                <dd>{base64Image ? "Ready" : "Initializing camera..."}</dd>
                            </div>
                            <div>
                                <dt>Active Email</dt>
                                <dd>{faceEmail || "Not provided"}</dd>
                            </div>
                            {userProfile ? (
                                <div className="profile-details">
                                    <p>
                                        <b>Name:</b> {getProfileValue("name", "Unknown")}
                                    </p>
                                    <p>
                                        <b>Email:</b> {getProfileValue("email", faceEmail || "Unknown")}
                                    </p>
                                    <p>
                                        <b>Bio:</b> {getProfileValue("bio", "Not set")}
                                    </p>
                                </div>
                            ) : (
                                <p className="muted-text">Verify a face to load profile data.</p>
                            )}
                        </dl>
                        {profileStatus ? <p className="status-text">{profileStatus}</p> : null}
                    </div>
                    <form onSubmit={handleRecognize} className="user-panel__form">
                        <label htmlFor="verify-email">Email to Verify</label>
                        <div className="form-row">
                            <input
                                id="verify-email"
                                type="email"
                                placeholder="jane@deepvision.ai"
                                value={faceEmail}
                                onChange={(event) => setFaceEmail(event.target.value)}
                                className="live-input"
                                required
                            />
                            <button className="primary-btn" type="submit" disabled={isRecognizing}>
                                {isRecognizing ? "Verifying..." : "Verify"}
                            </button>
                        </div>
                        {recognitionStatus ? <p className="status-text">{recognitionStatus}</p> : null}
                        {recognitionResult ? (
                            <div className="recognition-result">
                                <p>
                                    <b>Match:</b> {recognitionResult.isMatch ? "Yes" : "No"}
                                </p>
                                <p>
                                    <b>Confidence Score:</b> {recognitionResult.confidence.toFixed(4)}
                                </p>
                            </div>
                        ) : null}
                    </form>
                </article>
                <div className="video-panel">
                    <Webcam
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        className="video-feed"
                    />
                    {!base64Image ? <p className="video-placeholder">Activating camera…</p> : null}
                </div>
            </section>

            <section className="live-feed-bottom">
                <Card
                    title="Security Settings"
                    description="Fine-tune alert thresholds, device schedules, and escalation contacts."
                    className="live-card"
                >
                    <button className="ghost-btn" type="button">Open Control Center</button>
                </Card>
                <Card
                    title="Add Member"
                    description="Capture a face from the live feed and store it for future verification."
                    className="live-card"
                >
                    <form onSubmit={handleAddFace} className="live-form">
                        <input
                            type="email"
                            placeholder="someone@example.com"
                            value={faceEmail}
                            onChange={(event) => setFaceEmail(event.target.value)}
                            className="live-input"
                            required
                        />
                        <button className="primary-btn" type="submit" disabled={isAddingFace}>
                            {isAddingFace ? "Saving..." : "Add Face"}
                        </button>
                        {addFaceStatus ? <p className="status-text">{addFaceStatus}</p> : null}
                    </form>
                </Card>
            </section>
        </div>
    );
}
