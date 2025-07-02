import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { ToastContainer } from "react-toastify";

import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import VerifyPage from "./pages/VerifyPage";
import SearchEmailPage from "./pages/SearchEmailPage";
import RegisterPage from "./pages/RegisterPage";
import VerifyPassPage from "./pages/VerifyPassPage";
import RankPage from "./pages/RankPage";

import { SocketProvider } from "./contexts/SocketContext";
import { fetchUser } from "./features/appSlice";

const ProtectedRoute = () => {
  const { isAuthenticated } = useSelector((state) => state.app);

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <SocketProvider>
      <Outlet />
    </SocketProvider>
  );
};

function App() {
  const dispatch = useDispatch();

  const { isAuthenticated, isInitializing } = useSelector((state) => state.app);

  useEffect(() => {
    dispatch(fetchUser());
  }, [dispatch]);

  if (isInitializing) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          backgroundColor: "#1c1c2b",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <h2>Initializing Session...</h2>
      </div>
    );
  }

  return (
    <>
      <ToastContainer theme="dark" />
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
        <Route
          path="/email/search"
          element={
            !isAuthenticated ? <SearchEmailPage /> : <Navigate to="/home" />
          }
        />
        <Route
          path="/password/verify"
          element={
            !isAuthenticated ? <VerifyPassPage /> : <Navigate to="/home" />
          }
        />

        <Route element={<ProtectedRoute />}>
          <Route path="/home" element={<HomePage />} />
          <Route path="/rank" element={<RankPage />} />
          <Route path="/verify" element={<VerifyPage />} />
        </Route>

        <Route
          path="*"
          element={<Navigate to={isAuthenticated ? "/home" : "/"} />}
        />
      </Routes>
    </>
  );
}

export default App;
