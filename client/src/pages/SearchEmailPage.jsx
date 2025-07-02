import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router";
import { searchEmail } from "../features/authSlice";

export default function SearchEmailPage() {
  const [email, setEmail] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading } = useSelector((state) => state.auth);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    try {
      await dispatch(searchEmail({ email }));
      navigate("/verify/pass");
    } catch (error) {
      console.error("Error searching email:", error);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1f0036] via-[#2e026d] to-[#0e1324] px-4 py-12 font-[Orbitron]">
      <div className="w-full max-w-md bg-[#1a1a2e] text-white rounded-2xl shadow-2xl p-8 space-y-6 transform hover:scale-105 transition-all duration-300 border border-purple-500/30">
        <h2 className="text-3xl font-extrabold text-center text-purple-300 drop-shadow-sm">
          Forgot Password?
        </h2>
        <p className="text-sm text-center text-purple-100">
          Enter your email to recover your quiz access
        </p>

        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-[#23233b] border border-purple-500/50 text-purple-100 placeholder-purple-400 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 text-white font-bold shadow-md hover:shadow-lg hover:brightness-110 transition disabled:opacity-50"
          >
            {isLoading ? "Sending Code..." : "Search Email"}
          </button>
        </form>

        <p className="text-xs text-center text-purple-300 mt-2">
          We’ll send a 6-digit code to your email.
        </p>

        <div className="text-center mt-4">
          <a
            href="/"
            className="text-sm text-purple-400 hover:underline hover:text-purple-300 transition"
          >
            ← Back to Login
          </a>
        </div>
      </div>
    </main>
  );
}
