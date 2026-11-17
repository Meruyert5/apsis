import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Y2kDashboard } from "./Y2kDashboard";
import "./y2k.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Y2kDashboard />
  </StrictMode>,
);
