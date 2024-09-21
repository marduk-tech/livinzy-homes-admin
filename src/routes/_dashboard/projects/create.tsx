import { createFileRoute } from "@tanstack/react-router";
import { AddOrCreateProject } from "../../../components/add-or-edit-project";

export const Route = createFileRoute("/_dashboard/projects/create")({
  component: () => <AddOrCreateProject />,
});
