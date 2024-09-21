import { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { App as AntApp, ConfigProvider } from "antd";
import React, { Suspense } from "react";
import { antTheme } from "../theme/ant-theme";

import { envMode } from "../libs/constants";
import "../theme/globals.scss";

const TanStackRouterDevtools =
  envMode === "production"
    ? () => null // Render nothing in production
    : React.lazy(() =>
        // Lazy load in development
        import("@tanstack/router-devtools").then((res) => ({
          default: res.TanStackRouterDevtools,
          // For Embedded Mode
          // default: res.TanStackRouterDevtoolsPanel
        }))
      );

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

      <Suspense>
        <TanStackRouterDevtools />
      </Suspense>
    </>
  ),
});
