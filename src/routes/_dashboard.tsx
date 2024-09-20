import {
  createFileRoute,
  useLocation,
  useParams,
} from "@tanstack/react-router";
import { Loader } from "../components/loader";
import { DashboardLayout } from "../layouts/dashboard-layout";

export const Route = createFileRoute("/_dashboard")({
  // beforeLoad: async ({ context }) => {},
  pendingComponent: () => <Loader />,
  component: () => <DashboardLayout />,
});

// component: () => (
//   <CustomErrorBoundary>
//     <DashboardLayout />
//   </CustomErrorBoundary>
// ),
