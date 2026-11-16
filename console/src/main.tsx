import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/constellation.css";
import "./styles/hero.css";
import "./styles/survey.css";
import "./styles/atlas.css";
import "./styles/commands.css";
import "./styles/close.css";
import "./styles/surfaces.css";
import "./styles/field.css";
import "./styles/aurora.css";
import "./styles/orbital.css";
import "./styles/cosmos.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
