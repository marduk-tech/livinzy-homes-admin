import { useParams } from "react-router-dom";
import { ProjectDetails } from "./project-details";

export function EditProjectPage() {
  const { projectId } = useParams();

  return <ProjectDetails projectId={projectId} />;
}
