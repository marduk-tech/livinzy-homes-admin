import { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { App as AntApp, ConfigProvider } from "antd";
import { antTheme } from "../theme/ant-theme";

import "../theme/globals.scss";

interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: () => (
    <>
      <ConfigProvider theme={antTheme}>
        <AntApp>
          <Outlet />
        </AntApp>
      </ConfigProvider>

      <ReactQueryDevtools />

      <TanStackRouterDevtools />
    </>
  ),
});
