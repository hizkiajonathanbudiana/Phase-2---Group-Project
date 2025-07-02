// import React from "react";
// import ReactDOM from "react-dom/client";
// import { Provider } from "react-redux";
// import { store } from "./app/store";
// import { GoogleOAuthProvider } from "@react-oauth/google";
// import App from "./App.jsx";
// import "./index.css";

// import { BrowserRouter, Routes, Route, Navigate } from "react-router";

// import { SocketProvider } from "./contexts/SocketContext.jsx"; // Import SocketProvider

// ReactDOM.createRoot(document.getElementById("root")).render(
//   <React.StrictMode>
//     {/* 2. Provider dari Redux membungkus semuanya */}
//     <Provider store={store}>
//       <BrowserRouter>
//         <GoogleOAuthProvider clientId="621781117019-0qtib4f9busqj4khtdnqiso5ec0konoh.apps.googleusercontent.com">
//           {/* 3. BrowserRouter membungkus App */}
//           <SocketProvider>
//             {/* 4. Komponen App */}
//             <App />
//           </SocketProvider>
//         </GoogleOAuthProvider>
//       </BrowserRouter>
//     </Provider>
//   </React.StrictMode>
// );
import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "./app/store";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <GoogleOAuthProvider clientId="621781117019-0qtib4f9busqj4khtdnqiso5ec0konoh.apps.googleusercontent.com">
          <App />
        </GoogleOAuthProvider>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);
