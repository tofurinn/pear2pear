import { Routes, Route, useLocation } from "react-router-dom";
import './App.css';

import app from "./firebase/config";
console.log("YOUR FIREBASE IS GG FURKIN WORKINNNNN... PROJECT ID IS:", app.options.projectId);

// WHATEVER PAGES-----------------------------------------------------------------------------
import IndexPage from './pages/index/index'
import NotificationsPage from './pages/notifications/notifications'

//STUDENT PAGES -----------------------------------------------------------------------------

import MyDashboard from "./pages/student/dashboards/dashboard";

import MyRequests from "./pages/student/dashboards/requests/my-requests";
import MySessions from './pages/student/dashboards/sessions/my-sessions';
import MySupportHistory from './pages/student/dashboards/support-history/my-support-history';

import MultiStepRequestForm from './pages/student/request/request-form';
import MultiStepSessionForm from './pages/student/session/session-form';
import SessionRearrangement from './pages/student/session/session-rearrangement';
import FeedbackForm from './pages/student/feedback/feedback-form';

//VOLUNTEER PAGES -----------------------------------------------------------------------------
import VolunteerDashboard from "./pages/volunteer/dashboard/dashboard";
import VolunteerRequests from "./pages/volunteer/dashboard/request/my-support-requests";
import VolunteerSessions from "./pages/volunteer/dashboard/session/my-sessions";
import VolunteerHistory from "./pages/volunteer/dashboard/history/my-support-history";


function App() {
  const location = useLocation();

  return (
    <div className="page-background bg-default">
      <div key={location.pathname} className="page-transition">
        <Routes location={location}>
          {/* Public routes */}
          <Route path="/" element={<IndexPage />} />

          {/* Notifications */}
          <Route path="/notifications" element={<NotificationsPage />} />

          {/* - - - STUDENT ROUTES - - - */}
          {/* Dashboard Forms */}
          <Route path="/student/dashboard" element={<MyDashboard />} />
          <Route path="/student/my-requests" element={<MyRequests />} />
          <Route path="/student/my-sessions" element={<MySessions />} />
          <Route path="/student/my-support-history" element={<MySupportHistory />} />

          {/* Student Forms */}
          <Route path="/student/request-form" element={<MultiStepRequestForm />} />
          <Route path="/student/session-form" element={<MultiStepSessionForm />} />
          <Route path="/student/feedback-form/:sessID" element={<FeedbackForm />} />
          <Route path="/student/session/:sessID/edit" element={<SessionRearrangement />} />

          {/* - - - VOLUNTEER ROUTES - - - */}
          <Route path="/volunteer/dashboard" element={<VolunteerDashboard />} />
          <Route path="/volunteer/requests" element={<VolunteerRequests />} />
          <Route path="/volunteer/sessions" element={<VolunteerSessions />} />
          <Route path="/volunteer/history" element={<VolunteerHistory />} />
          <Route path="/volunteer/session-form" element={<MultiStepSessionForm />} />
          <Route path="/volunteer/session/:sessID/edit" element={<SessionRearrangement />} />
        </Routes>
      </div>
    </div>
  );
}

export default App
