import { createFileRoute } from "@tanstack/react-router";
import { Loader } from "../../../components/common/loader";
import { ProjectsList } from "../../../components/projects-list";
import { queries } from "../../../libs/queries";

export const Route = createFileRoute("/_dashboard/projects/")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(queries.getAllProjects()),
  component: () => <ProjectsPage />,
});

function ProjectsPage() {
  return <ProjectsList />;
}
