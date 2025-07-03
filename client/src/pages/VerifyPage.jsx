import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";

import {
  handleVerifyCode,
  sendVerificationCode,
  logoutUser,
} from "../features/authSlice";
import { fetchUser } from "../features/appSlice";

export default function VerifyPage() {
  const [verifyCode, setVerifyCode] = useState("");

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { isAuthenticated } = useSelector((state) => state.app);
  const { isSubmitting } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(sendVerificationCode());
    } else {
      navigate("/login", { replace: true });
    }
  }, [isAuthenticated, navigate, dispatch]);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    try {
      await dispatch(handleVerifyCode({ verifyCode })).unwrap();
      await dispatch(fetchUser());
      navigate("/home");
    } catch (error) {
      console.error("Error verifying code:", error);
    }
  };

  const backButton = async () => {
    try {
      await dispatch(logoutUser());
      navigate("/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] px-4 py-8 font-orbitron text-white">
      <div className="w-full max-w-md bg-[#1c1c2b] rounded-3xl shadow-[0_0_30px_rgba(128,0,255,0.4)] p-8 space-y-6 border border-purple-800 relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-fuchsia-500 to-cyan-500 rounded-3xl blur-[40px] opacity-20 z-0"></div>

        <div className="relative z-10">
          <h2 className="text-4xl font-extrabold text-center drop-shadow-xl tracking-wide text-white">
            🔐 Verification
          </h2>
          <p className="text-sm text-center text-gray-300 mt-2 tracking-wide">
            Enter the 6-digit code sent to your email
          </p>

          <form onSubmit={handleFormSubmit} className="space-y-4 mt-6">
            <div>
              <input
                type="text"
                placeholder="Enter verification code"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-600 bg-[#2a2a40] text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-400 shadow-inner text-sm tracking-widest text-center uppercase"
              />
            </div>

            {/* 3. Tombol diubah untuk menggunakan isSubmitting */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white font-bold shadow-[0_4px_20px_rgba(255,0,255,0.4)] hover:brightness-125 transition duration-300 disabled:opacity-50"
            >
              {isSubmitting ? "Verifying..." : "Verify Code"}
            </button>
          </form>

          <div className="text-center mt-4">
            {/* 4. Menggunakan Link component untuk navigasi SPA yang benar */}
            <button
              onClick={() => backButton()}
              className="text-sm text-cyan-400 hover:underline hover:text-cyan-300 transition"
            >
              ← Back to Login
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
