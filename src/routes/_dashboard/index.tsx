import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_dashboard/")({
  component: () => <Navigate to={"/projects"} />,
});
