import { QueryClientProvider } from "@tanstack/react-query";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { FunctionComponent } from "react";
import { queryClient } from "./libs/query-client";
import { routeTree } from "./routeTree.gen";

interface AppProps {}

const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: "intent",
  defaultPreloadStaleTime: 0,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

function InnerApp() {
  // const user = useUser();
  return (
    <RouterProvider
      router={router}
      // context={{ user: user, queryClient: queryClient }}
    />
  );
}

export const App: FunctionComponent<AppProps> = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <InnerApp />
    </QueryClientProvider>
  );
};
