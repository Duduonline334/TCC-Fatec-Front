import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";
import App from "./App";
import ProfilePage from "./pages/profile";
import Sensor from "./pages/sensor";
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/perfil" element={<ProfilePage />} />
        <Route path="/login" element={<App />} />
        <Route path="/cadastro" element={<App />} />
        <Route path="/sensor" element={<Sensor />} />
        <Route
          path="*"
          element={
            <Navigate
              replace
              to={localStorage.getItem("token") ? "/sensor" : "/login"}
            />
          }
        />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
