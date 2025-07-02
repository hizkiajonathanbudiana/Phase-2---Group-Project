import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router";
import { GoogleLogin } from "@react-oauth/google";
import { toast } from "react-toastify";

import { loginUser, googleLoginUser } from "../features/appSlice";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useSelector((state) => state.app);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/verify");
    }
  }, [isAuthenticated, navigate]);

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (isLoading) return;
    dispatch(loginUser({ email, password }));
  };

  const handleGoogleSuccess = (res) => {
    dispatch(googleLoginUser({ token: res.credential }));
  };

  const handleGoogleError = () => {
    toast.error("Google login failed. Please try again.");
  };

  return (
    <>
      <main>
        <form onSubmit={handleFormSubmit}>
          <div>
            <div></div>
            <input
              type="text"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <div></div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" disabled={isLoading}>
            {isLoading ? "Logging in..." : "Log In"}
          </button>
        </form>

        <div>
          <div className="flex-grow border-t border-gray-300"></div>
          <span className="mx-4 text-xs font-light text-gray-500">OR</span>
          <div className="flex-grow border-t border-gray-300"></div>
        </div>

        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            theme="outline"
            shape="pill"
            size="large"
          />
        </div>
      </main>
    </>
  );
}
