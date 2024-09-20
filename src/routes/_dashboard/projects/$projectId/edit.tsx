import { createFileRoute } from "@tanstack/react-router";
import { AddOrCreateProject } from "../../../../components/add-or-edit-project";
import { queries } from "../../../../libs/queries";

export const Route = createFileRoute("/_dashboard/projects/$projectId/edit")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(
      queries.getProjectById(params.projectId)
    ),
  component: () => <EditProjectPage />,
});

function EditProjectPage() {
  const { projectId } = Route.useParams();

  return <AddOrCreateProject projectId={projectId} />;
}
