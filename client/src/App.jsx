import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";

import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import VerifyPage from "./pages/VerifyPage";
import SearchEmailPage from "./pages/SearchEmail";
import RegisterPage from "./pages/RegisterPage";
import VerifyPassPage from "./pages/VerifyPassPage";

import { fetchUser } from "./features/authSlice";
import { SocketProvider } from "./contexts/SocketContext";

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, loading } = useSelector((state) => state.app);

  useEffect(() => {
    dispatch(fetchUser());
  }, [dispatch]);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <h2>Loading...</h2>
      </div>
    );
  }

  return (
    <>
      <ToastContainer />
      <Routes>
        <Route
          path="/"
          element={!isAuthenticated ? <LoginPage /> : <Navigate to="/home" />}
        />
        <Route
          path="/register"
          element={
            !isAuthenticated ? <RegisterPage /> : <Navigate to="/home" />
          }
        />

        <Route path="/email/search" element={<SearchEmailPage />} />
        <Route path="/password/verify" element={<VerifyPassPage />} />

        <Route
          path="/verify"
          element={isAuthenticated ? <VerifyPage /> : <Navigate to="/" />}
        />

        <Route
          path="/home"
          element={
            isAuthenticated ? (
              <SocketProvider>
                <HomePage />
              </SocketProvider>
            ) : (
              <Navigate to="/" />
            )
          }
        />

        <Route
          path="*"
          element={<Navigate to={isAuthenticated ? "/home" : "/"} />}
        />
      </Routes>
    </>
  );
}

export default App;
