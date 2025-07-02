import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import VerifyPage from "./pages/VerifyPage";
import SearchEmailPage from "./pages/SearchEmailPage";
import VerifyPassPage from "./pages/VerifyPassPage";
import HomePage from "./pages/HomePage";

import { ToastContainer } from "react-toastify";

function App() {
  return (
    <>
      <BrowserRouter>
        <ToastContainer />
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify" element={<VerifyPage />} />
          <Route path="/email/search" element={<SearchEmailPage />} />
          <Route path="/password/verify" element={<VerifyPassPage />} />
          <Route path="/home" element={<HomePage />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
