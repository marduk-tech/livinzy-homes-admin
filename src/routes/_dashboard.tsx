import { createFileRoute } from "@tanstack/react-router";
import { CustomErrorBoundary } from "../components/custom-error-boundary";
import { Loader } from "../components/loader";
import { DashboardLayout } from "../layouts/dashboard-layout";

export const Route = createFileRoute("/_dashboard")({
  // beforeLoad: async ({ context }) => {},
  pendingComponent: () => <Loader />,
  component: () => (
    <CustomErrorBoundary>
      <DashboardLayout />
    </CustomErrorBoundary>
  ),
});
