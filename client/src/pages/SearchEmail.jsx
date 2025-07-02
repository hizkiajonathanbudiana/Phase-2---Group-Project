import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router";

import { searchEmail } from "../features/appSlice";

export default function SearchEmailPage() {
  const [email, setEmail] = useState("");

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useSelector((state) => state.app);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/verify");
    }
  }, [isAuthenticated, navigate, dispatch]);

  const handleFormSubmit = async (e) => {
    try {
      e.preventDefault();
      if (isLoading) return;
      await dispatch(searchEmail({ email }));
      navigate("/verify/pass");
    } catch (error) {
      console.error("Error searching email:", error);
    }
  };

  return (
    <>
      <main>
        <form onSubmit={handleFormSubmit}>
          <div>
            <div></div>
            <input
              type="text"
              placeholder="Search Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
