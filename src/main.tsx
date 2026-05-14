/**
 * Arquivo principal de entrada da aplicação React.
 * Inicializa a renderização do componente App dentro do elemento raiz.
 */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
