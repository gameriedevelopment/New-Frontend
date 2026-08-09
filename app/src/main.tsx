import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/index.css";
import "./app.css";
import "./features/auth/auth.css";
import "./app/shell/shell.css";
import { App } from "./App";

const root = document.getElementById("root");

if (!root) throw new Error("App root element was not found");

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
