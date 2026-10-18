import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import './App.css';
import Titled from "./components/titled";
import { routes } from "./routes.tsx";

import app from "./firebase/config";
console.log("YOUR FIREBASE IS WORKING: ", app.options.projectId);

function App() {
  const location = useLocation();
  const legacyNotificationDashboardPath =
    (location.state as { dashboardPath?: unknown } | null)?.dashboardPath;

  return (
    <div className="page-background bg-default">
      <Routes location={location}>
        {/* Legacy notifications redirect (no title needed) */}
        <Route
          path="/notifications"
          element={
            <Navigate
              to={legacyNotificationDashboardPath === '/volunteer/dashboard'
                ? '/volunteer/notifications'
                : '/student/notifications'}
              replace
            />
          }
        />

        {/* All other routes (and their titles) live in routes.tsx */}
        {routes.map(({ path, title, element }) => (
          <Route
            key={path}
            path={path}
            element={<Titled title={title}>{element}</Titled>}
          />
        ))}
      </Routes>
    </div>
  );
}

export default App