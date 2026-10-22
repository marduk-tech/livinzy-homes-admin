import { Navigate, Route, Routes } from "react-router-dom";

//Layouts
import { AuthenticationGuard } from "../components/auth/authentication-guard";
import { DashboardLayout } from "../layouts/dashboard-layout";

// Pages
import { AuthCallback } from "../components/auth/auth-callback";
import { Unauthorized } from "../components/auth/unauthorized";
import AskPage from "../pages/ask-page";
import { Brick360Data } from "../pages/brick360-projects/brick360-data";
import { Brick360ListPage } from "../pages/brick360-projects/brick360-list";
import { Brick360Full } from "../pages/brick360-projects/brick360-project";
import { BrickfiConfig } from "../pages/brickfi-config";
import { BrickfiLoggerPage } from "../pages/brickfi-logger-page";
import ChromaDocsPage from "../pages/chroma-docs";
import { EncyclopediaPage } from "../pages/encyclopedia-page";
import { LivIndexScorePage } from "../pages/liveindexscores-page";
import { ManageScriptsPage } from "../pages/manage-scripts/manage-scripts-page";
import { PortalGatewayPage } from "../pages/portal-gateway/portal-gateway-page";
import { MarketingPage } from "../pages/marketing/marketing-page";
import { MicroPocketScore } from "../pages/micro-pockets/micro-pocket-score";
import { CreateProjectPage } from "../pages/projects/create-project-page";
import { EditProjectPage } from "../pages/projects/edit-project-page";
import { ProjectsListPage } from "../pages/projects/projects-list";
import { ThirdPartyPage } from "../pages/third-party/third-party-page";
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
        <Route
          path="/brick360Data/:brick360ProjectId?"
          element={<Brick360Data />}
        ></Route>
        <Route
          path="/micro-pockets/:microPocketId"
          element={<MicroPocketScore />}
        ></Route>
        <Route path="/ask" element={<AskPage />} />

        <Route path="/users" element={<UsersPage />} />
        {/* see brickfi-logger-paths.ts for the URL structure */}
        <Route
          path="/brickfi-logger"
          element={<Navigate to="/brickfi-logger/threads" replace />}
        />
        <Route
          path="/brickfi-logger/threads/:threadId?"
          element={<BrickfiLoggerPage tab="threads" />}
        />
        <Route
          path="/brickfi-logger/feedback"
          element={<BrickfiLoggerPage tab="feedback" />}
        />
        <Route
          path="/brickfi-logger/prompts"
          element={<BrickfiLoggerPage tab="prompts" />}
        />
        <Route
          path="/brickfi-logger/revisions"
          element={<BrickfiLoggerPage tab="revisions" />}
        />
        <Route path="/traces" element={<Navigate to="/brickfi-logger/threads" replace />} />

        <Route path="/marketing" element={<MarketingPage />} />
        <Route path="/manage-scripts" element={<ManageScriptsPage />} />
        <Route path="/portal-gateway" element={<PortalGatewayPage />} />
        <Route path="/third-party" element={<ThirdPartyPage />} />
      </Route>

      <Route path="/*" element={<div>404</div>} />
    </Routes>
  );
};
