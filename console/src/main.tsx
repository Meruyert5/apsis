import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles/bio.css";
import "./styles/acts.css";
import "./styles/observatory.css";
import "./styles/crew.css";
import "./styles/refine.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
