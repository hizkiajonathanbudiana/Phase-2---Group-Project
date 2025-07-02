import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router";

import { verifyForgotPass } from "../features/appSlice";

export default function VerifyPassPage() {
  const [verifyCode, setVerifyCode] = useState("");
  const [password, setPassword] = useState("");

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useSelector((state) => state.app);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate, dispatch]);

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (isLoading) return;
    dispatch(verifyForgotPass({ verifyCode, password }));
  };

  return (
    <>
      <main>
        <form onSubmit={handleFormSubmit}>
          <div>
            <div></div>
            <input
              type="text"
              placeholder="code"
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value)}
            />
          </div>

          <div>
            <div></div>
            <input
              type="password"
              placeholder="New Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" disabled={isLoading}>
            {isLoading ? "Verifying..." : "Verify"}
          </button>
        </form>
      </main>
    </>
  );
}
