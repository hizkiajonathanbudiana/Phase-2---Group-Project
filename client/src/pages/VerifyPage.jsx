import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router";

import { handleVerifyCode, sendVerificationCode } from "../features/appSlice";

export default function VerifyPage() {
  const [verifyCode, setVerifyCode] = useState("");

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useSelector((state) => state.app);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    } else {
      dispatch(sendVerificationCode());
    }
  }, [isAuthenticated, navigate, dispatch]);

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (isLoading) return;
    dispatch(handleVerifyCode({ verifyCode }));
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

          <button type="submit" disabled={isLoading}>
            {isLoading ? "Verifying..." : "Verify"}
          </button>
        </form>
      </main>
    </>
  );
}
