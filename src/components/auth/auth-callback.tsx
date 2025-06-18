// src/pages/AuthCallback.tsx
import { useAuth0 } from "@auth0/auth0-react";
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export const AuthCallback = () => {
  const { isLoading, isAuthenticated, error } = useAuth0();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const authError = params.get("error");
    const authErrorDesc = params.get("error_description");

    if (authError || error) {
      console.error("Auth0 Error:", authErrorDesc || error?.message);
      navigate("/unauthorized", { replace: true });
      return;
    }

    if (!isLoading && isAuthenticated) {
      // Redirect to home or original page
      navigate("/", { replace: true });
    }
  }, [isLoading, isAuthenticated, error, navigate, location]);

  return <div>Processing login...</div>;
};