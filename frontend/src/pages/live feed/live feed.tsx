import { useCallback, useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import "../../styles/live feed.css"

export default function LiveFeed() {
    const webcamRef = useRef<Webcam>(null);
    const [base64Image, setBase64Image] = useState<string>("");

    const capture = useCallback(() => {
        const imageSrc = webcamRef.current?.getScreenshot();
        if (imageSrc) {
            setBase64Image(imageSrc);
        }
    }, [webcamRef]);

    useEffect(() => {
        const interval = setInterval(() => {
            capture();
        }, 1000);
        return () => clearInterval(interval);
    }, [capture]);

  return (
    <div className="live-feed-main-container">
        <div className="row w-full justify-center">
        <Webcam
        ref={webcamRef}
        />
        <div className="info-container">
            <h2>Information</h2>
            <p><b>Person Verified Status:</b> Verified </p>
            <p><b>Name:</b> Sharjeel Baig </p>
            <p><b>Bio:</b> Software Engineer </p>
        </div>
        </div>
    </div>
  )
}
