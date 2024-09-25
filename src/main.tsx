import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./app.tsx";
import { CustomAuth0Provider } from "./components/auth/auth0-provider.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <CustomAuth0Provider>
        <App />
      </CustomAuth0Provider>
    </BrowserRouter>
  </StrictMode>
);
