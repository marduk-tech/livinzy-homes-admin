import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { App as AntApp, AppProps, ConfigProvider } from "antd";
import { FunctionComponent } from "react";
import { queryClient } from "./libs/query-client";
import { Router } from "./routes/routes";
import { antTheme } from "./theme/ant-theme";
import "./theme/globals.scss";

export const App: FunctionComponent<AppProps> = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider theme={antTheme}>
        <AntApp>
          <Router />
        </AntApp>
      </ConfigProvider>

      <ReactQueryDevtools />
    </QueryClientProvider>
  );
};
