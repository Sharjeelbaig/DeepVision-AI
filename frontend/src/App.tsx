import Login from "./pages/authentication/login";
import Register from "./pages/authentication/register";
import ForgotPassword from "./pages/authentication/forgot-password";
import Home from "./pages/home/home";
import LiveFeed from "./pages/live feed/live feed";

import { BrowserRouter, Route, Routes } from "react-router-dom";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/home" element={<Home />} />
        <Route path="/live-feed" element={<LiveFeed />} />
      </Routes>
    </BrowserRouter>
  );
}
