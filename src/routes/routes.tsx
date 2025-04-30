import { Navigate, Route, Routes } from "react-router-dom";

//Layouts
import { AuthenticationGuard } from "../components/auth/authentication-guard";
import { DashboardLayout } from "../layouts/dashboard-layout";

// Pages
import AskPage from "../pages/ask-page";
import ChromaDocsPage from "../pages/chroma-docs";
import { GlobalKnowledgePage } from "../pages/global-knowledge-page";
import { LivIndexScorePage } from "../pages/liveindexscores-page";
import { BrickfiConfig } from "../pages/brickfi-config";
import { CreateProjectPage } from "../pages/projects/create-project-page";
import { EditProjectPage } from "../pages/projects/edit-project-page";
import { ProjectsListPage } from "../pages/projects/projects-list";
import { UsersPage } from "../pages/users-page";

export const Router = () => {
  return (
    <Routes>
      <Route element={<AuthenticationGuard component={DashboardLayout} />}>
        <Route path="/" element={<Navigate to="/projects" />} />
        <Route path="/projects" element={<ProjectsListPage />} />

        <Route path="/livindex-scores" element={<LivIndexScorePage />} />
        <Route path="/config" element={<BrickfiConfig />} />

        <Route path="/global-knowledge" element={<GlobalKnowledgePage />} />

        <Route path="/chroma-docs" element={<ChromaDocsPage />} />

        <Route path="/projects/:projectId/edit" element={<EditProjectPage />} />

        <Route path="/projects/create" element={<CreateProjectPage />} />

        <Route path="/ask" element={<AskPage />} />

        <Route path="/users" element={<UsersPage />} />
      </Route>

      <Route path="/*" element={<div>404</div>} />
    </Routes>
  );
};
