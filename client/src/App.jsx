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

import { fetchUser } from "./features/appSlice";
import { SocketProvider } from "./contexts/SocketContext";

function App() {
  const dispatch = useDispatch();
  // Get the loading and isAuthenticated states from the Redux store
  const { isAuthenticated, loading } = useSelector((state) => state.app);

  useEffect(() => {
    // This will attempt to fetch the user based on the cookie/token
    // on the initial application load.
    dispatch(fetchUser());
  }, [dispatch]); // dispatch is stable, so this effect runs once on mount

  // While the initial user fetch is happening, show a loading indicator.
  // This is the key to preventing rendering with incomplete data.
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
        {/* If the user is authenticated, trying to access login/register will redirect to home */}
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

        {/* Publicly accessible routes for password reset */}
        <Route path="/email/search" element={<SearchEmailPage />} />
        <Route path="/email/verify" element={<VerifyPassPage />} />

        {/* This route can be accessed by an authenticated user who is not yet verified */}
        <Route
          path="/verify"
          element={isAuthenticated ? <VerifyPage /> : <Navigate to="/" />}
        />

        {/* This is the protected route. It will only render HomePage if the user is authenticated. */}
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

        {/* A catch-all route to redirect any unknown paths */}
        <Route
          path="*"
          element={<Navigate to={isAuthenticated ? "/home" : "/"} />}
        />
      </Routes>
    </>
  );
}

export default App;

// import { useEffect } from "react";
// import { useSelector } from "react-redux";
// import { useDispatch } from "react-redux";
// import { ToastContainer } from "react-toastify";
// import { Routes, Route, Navigate } from "react-router";

// import LoginPage from "./pages/LoginPage";
// import HomePage from "./pages/HomePage";
// import VerifyPage from "./pages/VerifyPage";
// import SearchEmailPage from "./pages/SearchEmail";
// import RegisterPage from "./pages/RegisterPage";
// import { fetchUser } from "./features/appSlice";
// import VerifyPassPage from "./pages/VerifyPassPage";

// import { SocketProvider } from "./contexts/SocketContext";

// function App() {
//   const dispatch = useDispatch();
//   const { isAuthenticated } = useSelector((state) => state.app);

//   useEffect(() => {
//     dispatch(fetchUser());
//   }, []);

//   return (
//     <>
//       <ToastContainer />
//       <Routes>
//         {/* {!isAuthenticated ? (
//           <> */}
//         <Route path="/" element={<LoginPage />} />
//         <Route path="/register" element={<RegisterPage />} />
//         <Route path="/verify" element={<VerifyPage />} />
//         <Route path="/email/search" element={<SearchEmailPage />} />
//         <Route path="/email/verify" element={<VerifyPassPage />} />
//         {/* </>
//         ) : ( */}
//         <Route
//           path="/home"
//           element={
//             <SocketProvider>
//               <HomePage />
//             </SocketProvider>
//           }
//         />
//         {/* )} */}
//         <Route path="*" element={<Navigate to="/" replace />} />
//       </Routes>
//     </>
//   );
// }

// export default App;
