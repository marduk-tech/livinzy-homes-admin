import { withAuthenticationRequired } from "@auth0/auth0-react";
import { Loader } from "../common/loader";

/**
 * Authentication Guard component
 * Wraps a component with authentication requirement
 * @param component The component to be protected by authentication
 */
export const AuthenticationGuard = ({ component }: any) => {
  const Component = withAuthenticationRequired(component, {
    onRedirecting: () => (
      <div>
        <Loader />
      </div>
    ),
  });

  return <Component />;
};
