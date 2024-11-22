import { Navigate, Route, Routes } from "react-router-dom";

//Layouts
import { AuthenticationGuard } from "../components/auth/authentication-guard";
import { DashboardLayout } from "../layouts/dashboard-layout";

// Pages
import AskPage from "../pages/ask-page";
import { LivestmentScorePage } from "../pages/livestment-page";
import { LivindexPlacesPage } from "../pages/livindexplaces";
import { CreateProjectPage } from "../pages/projects/create-project-page";
import { EditProjectPage } from "../pages/projects/edit-project-page";
import { ProjectsListPage } from "../pages/projects/projects-list";

export const Router = () => {
  return (
    <Routes>
      <Route element={<AuthenticationGuard component={DashboardLayout} />}>
        <Route path="/" element={<Navigate to="/projects" />} />
        <Route path="/projects" element={<ProjectsListPage />} />

        <Route path="/livestment" element={<LivestmentScorePage />} />
        <Route path="/livindex-places" element={<LivindexPlacesPage />} />

        <Route path="/projects/:projectId/edit" element={<EditProjectPage />} />

        <Route path="/projects/create" element={<CreateProjectPage />} />

        <Route path="/ask" element={<AskPage />} />
      </Route>

      <Route path="/*" element={<div>404</div>} />
    </Routes>
  );
};
