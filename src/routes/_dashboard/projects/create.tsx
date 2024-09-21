import { createFileRoute } from "@tanstack/react-router";
import { ProjectDetails } from "../../../components/project-details";

export const Route = createFileRoute("/_dashboard/projects/create")({
  component: () => <ProjectDetails />,
});
