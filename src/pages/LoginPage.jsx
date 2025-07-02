import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { toast } from "react-toastify";

import { loginUser, googleLoginUser } from "../features/authSlice";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { isAuthenticated } = useSelector((state) => state.app);
  const { isSubmitting } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/home", { replace: true });
    }
  }, [navigate, isAuthenticated]);

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    dispatch(loginUser({ email, password }));
  };

  const handleGoogleSuccess = (res) => {
    dispatch(googleLoginUser({ token: res.credential }));
  };

  const handleGoogleError = () => {
    toast.error("Google login failed. Please try again.");
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] px-4 py-8 font-orbitron text-white">
      <div className="w-full max-w-md bg-[#1c1c2b] rounded-3xl shadow-[0_0_30px_rgba(128,0,255,0.4)] p-8 space-y-6 border border-purple-800 relative overflow-hidden">
        {/* Glow border effect */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-fuchsia-500 to-cyan-500 rounded-3xl blur-[40px] opacity-20 z-0"></div>

        <div className="relative z-10">
          <h1 className="text-4xl font-extrabold text-center drop-shadow-xl text-white tracking-widest">
            🚀 QuizRush.AI
          </h1>
          <p className="text-center text-sm text-gray-300 mt-2 tracking-wide">
            Login to enter the real-time quiz battle!
          </p>

          {/* Form */}
          <form onSubmit={handleFormSubmit} className="space-y-4 mt-6">
            {/* Email Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-4 pr-4 py-3 rounded-xl border border-gray-600 bg-[#2a2a40] text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-400 shadow-inner text-sm"
              />
            </div>

            {/* Password Input */}
            <div className="relative">
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-4 pr-4 py-3 rounded-xl border border-gray-600 bg-[#2a2a40] text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-400 shadow-inner text-sm"
              />
            </div>

            {/* 3. Tombol diubah untuk menggunakan isSubmitting */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white font-bold shadow-[0_4px_20px_rgba(255,0,255,0.4)] hover:brightness-125 transition duration-300 disabled:opacity-50"
            >
              {isSubmitting ? "Logging in..." : "Enter the Arena"}
            </button>

            <div className="text-center mt-2">
              <Link
                to="/email/search"
                className="text-sm text-cyan-400 hover:underline hover:text-cyan-300"
              >
                Forgot your password?
              </Link>
            </div>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-2 text-sm text-gray-400 mt-6">
            <div className="flex-1 h-px bg-gray-600" />
            <span>OR</span>
            <div className="flex-1 h-px bg-gray-600" />
          </div>

          {/* Google Button */}
          <div className="flex justify-center mt-4">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              theme="filled_black"
              shape="pill"
              size="large"
            />
          </div>

          {/* Register Redirect */}
          <div className="text-center text-sm mt-4 text-gray-400">
            Don’t have an account?{" "}
            <Link
              to="/register"
              className="text-cyan-400 hover:underline hover:text-cyan-300 font-medium"
            >
              Register now
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
