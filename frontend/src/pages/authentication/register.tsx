import { Link } from 'react-router'
import '../../styles/authentication.css'
export default function Register() {
  return (
    <div className='main-container'>
        <div className="logo-container">
            <h1>DeepVision</h1>
            <img src="/logo.png" alt="DeepVision Logo" className="logo-image" />
        </div>
        <input type="text" placeholder="First Name" className="input" />
        <input type="text" placeholder="Last Name" className="input" />
        <input type="number" placeholder="Phone Number" className="input" />
        <input type="email" placeholder="Email" className="input" />
        <input type="password" placeholder="Password" className="input" />
        <button className="submit-button">Signup</button>
        <Link to="/login" className="redirect-link">
            I Already have an account
        </Link>
    </div>
  )
}
