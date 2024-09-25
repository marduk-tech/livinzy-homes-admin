import { useAuth0 } from "@auth0/auth0-react";

/**
 * Logout Button component
 * Provides a button to log out the user
 */
const LogoutButton = () => {
  const { logout } = useAuth0();

  return (
    <button
      onClick={() =>
        logout({ logoutParams: { returnTo: window.location.origin } })
      }
    >
      Log Out
    </button>
  );
};

export default LogoutButton;
