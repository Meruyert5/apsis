import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { NeonDashboard } from "./NeonDashboard";
import "./neon.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <NeonDashboard />
  </StrictMode>,
);
