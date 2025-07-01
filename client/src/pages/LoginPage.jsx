import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router";
import { GoogleLogin } from "@react-oauth/google";
import Toastify from "toastify-js";

import {
  loginUser,
  googleLoginUser,
  registerUser,
} from "../features/authSlice.js";

const showToast = (message, type = "info") => {
  const colors = {
    success: "#D1FAE5",
    error: "#FECACA",
    info: "#E0E7FF",
  };
  Toastify({
    text: message,
    duration: 4000,
    close: true,
    gravity: "top",
    position: "center",
    style: {
      background: colors[type] || "#E0E7FF",
      color: "#1F2937",
      padding: "12px 20px",
      borderRadius: "8px",
    },
  }).showToast();
};

export default function LoginPage() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status, error, user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (status === "succeeded" && user) {
      showToast("Welcome back!", "success");
      navigate("/home");
    } else if (mode === "register" && status === "succeeded" && !user) {
      showToast("Registration successful! Please log in.", "success");
      setMode("login");
      setEmail("");
      setPassword("");
    } else if (status === "failed" && error) {
      showToast(error, "error");
    }
  }, [status, error, user, navigate, mode]);

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (mode === "login") {
      dispatch(loginUser({ email, password }));
    } else {
      dispatch(registerUser({ email, password }));
    }
  };

  const handleGoogleSuccess = (res) => {
    dispatch(googleLoginUser({ token: res.credential }));
  };

  const handleGoogleError = () => {
    showToast("Google login failed. Please try again.", "error");
  };

  const toggleMode = () => {
    setMode(mode === "login" ? "register" : "login");
    setEmail("");
    setPassword("");
  };

  const isLoading = status === "loading";

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white shadow-md rounded-lg p-8">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">
          {mode === "login" ? "Login to Your Account" : "Create an Account"}
        </h1>

        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 w-full px-4 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 w-full px-4 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition disabled:opacity-50"
          >
            {isLoading
              ? mode === "login"
                ? "Logging in..."
                : "Registering..."
              : mode === "login"
              ? "Login"
              : "Sign Up"}
          </button>
        </form>

        <div className="flex items-center my-6">
          <hr className="flex-grow border-t border-gray-300" />
          <span className="mx-2 text-sm text-gray-400">or</span>
          <hr className="flex-grow border-t border-gray-300" />
        </div>

        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            shape="pill"
            theme="outline"
          />
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={toggleMode}
            className="text-sm text-purple-600 hover:underline"
          >
            {mode === "login"
              ? "Don't have an account? Register"
              : "Already have an account? Login"}
          </button>
        </div>
      </div>
    </main>
  );
}
