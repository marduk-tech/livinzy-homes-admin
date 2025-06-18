// src/pages/Unauthorized.tsx
import { useAuth0 } from "@auth0/auth0-react";
import { Button, Flex } from "antd";

export const Unauthorized = () => {
  const { loginWithRedirect } = useAuth0();

  const handleLoginAgain = () => {
    loginWithRedirect({
      authorizationParams: {
        prompt: "login",
      },
      appState: { returnTo: "/" },
    });
  };

  return (
    <Flex vertical align="center" style={{marginTop: 100}}>
      <h2>Access Denied</h2>
      <p>Your email is not authorized to log in.</p>
      <Button style={{width: 250}} onClick={handleLoginAgain}>Login with a different account</Button>
    </Flex>
  );
};
