import { Link } from "react-router";
import "../../styles/authentication.css";
import { useEffect } from "react";
export default function Login() {
  useEffect(() => {
    
  }, []);
  return (
    <div className="authentication-main-container">
      <div className="logo-container">
        <h1>DeepVision</h1>
        <img src="/logo.png" alt="DeepVision Logo" className="logo-image" />
      </div>

      <img src="/cover.png" alt="Cover" className="cover-image" />
      <img src="/logo.png" alt="App Logo" className="cover-image-small" />

      <input type="email" placeholder="Email" className="input" />
      <input type="password" placeholder="Password" className="input" />
      <button className="submit-button">Login</button>

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
