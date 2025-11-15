import { Navigate, Route, Routes } from "react-router-dom";

//Layouts
import { AuthenticationGuard } from "../components/auth/authentication-guard";
import { DashboardLayout } from "../layouts/dashboard-layout";

// Pages
import { AuthCallback } from "../components/auth/auth-callback";
import { Unauthorized } from "../components/auth/unauthorized";
import AskPage from "../pages/ask-page";
import { Brick360ListPage } from "../pages/brick360-projects/brick360-list";
import { Brick360Full } from "../pages/brick360-projects/brick360-project";
import { BrickfiConfig } from "../pages/brickfi-config";
import ChromaDocsPage from "../pages/chroma-docs";
import { EncyclopediaPage } from "../pages/encyclopedia-page";
import { LivIndexScorePage } from "../pages/liveindexscores-page";
import { GlossaryPage } from "../pages/marketing/glossary-page";
import { CreateProjectPage } from "../pages/projects/create-project-page";
import { EditProjectPage } from "../pages/projects/edit-project-page";
import { ProjectsListPage } from "../pages/projects/projects-list";
import { TracesPage } from "../pages/traces-page";
import { UsersPage } from "../pages/users-page";

export const Router = () => {
  return (
    <Routes>
      <Route path="/auth-callback" element={<AuthCallback />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route element={<AuthenticationGuard component={DashboardLayout} />}>
        <Route path="/" element={<Navigate to="/projects" />} />
        <Route path="/projects" element={<ProjectsListPage />} />

        <Route path="/livindex-scores" element={<LivIndexScorePage />} />
        <Route path="/config" element={<BrickfiConfig />} />

        <Route path="/encyclopedia" element={<EncyclopediaPage />} />

        <Route path="/chroma-docs" element={<ChromaDocsPage />} />

        <Route path="/projects/:projectId/edit" element={<EditProjectPage />} />

        <Route path="/projects/create" element={<CreateProjectPage />} />

        <Route path="/brick360" element={<Brick360ListPage />}></Route>
        <Route
          path="/brick360/:brick360ProjectId?"
          element={<Brick360Full />}
        ></Route>
        <Route path="/ask" element={<AskPage />} />

        <Route path="/users" element={<UsersPage />} />
        <Route path="/traces" element={<TracesPage />} />

        <Route path="/marketing/glossary" element={<GlossaryPage />} />
      </Route>

      <Route path="/*" element={<div>404</div>} />
    </Routes>
  );
};
