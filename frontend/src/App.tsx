import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import './App.css';

import app from "./firebase/config";
console.log("YOUR FIREBASE IS GG FURKIN WORKINNNNN... PROJECT ID IS:", app.options.projectId);

// PUBLIC PAGES-----------------------------------------------------------------------------
import IndexPage from './pages/index/index'
import Require2FA from "./components/require-2fa";

// REGISTRATION PAGES-----------------------------------------------------------------------------
import UserRegisterPage from "./pages/registration/user-register/user-register";
import VolunteerRegisterPage from "./pages/registration/volunteer-register/volunteer-register";
import EmailValidationPage from "./pages/registration/email-validation/email-validation";
import SetPasswordPage from "./pages/registration/set-password/set-password";
import AccountCreatedPage from "./pages/registration/account-created/account-created";
import VolunteerRegisteredPage from "./pages/registration/account-created/volunteer-registered";

// LOGIN PAGES-----------------------------------------------------------------------------
import UserLoginPage from "./pages/login/login";
import ForgotPasswordPage from "./pages/login/forgot-password/input-email";
import EmailVerificationPage from "./pages/login/2FA/2fa";

//STUDENT PAGES -----------------------------------------------------------------------------

import MyDashboard from "./pages/student/dashboards/dashboard";

import MyRequests from "./pages/student/dashboards/requests/my-requests";
import MySessions from './pages/student/dashboards/sessions/my-sessions';
import MySupportHistory from './pages/student/dashboards/support-history/my-support-history';

import MultiStepRequestForm from './pages/student/request/request-form';
import MultiStepSessionForm from './pages/student/session/session-form';
import SessionRearrangement from './pages/student/session/session-rearrangement';
import FeedbackForm from './pages/student/feedback/feedback-form';
import StudentNotifications from './pages/student/notifications/notifications';
import StudentSettings from './pages/student/settings/student-settings';

//VOLUNTEER PAGES -----------------------------------------------------------------------------
import VolunteerDashboard from "./pages/volunteer/dashboards/dashboard";
import VolunteerRequests from "./pages/volunteer/dashboards/request/my-requests";
import VolunteerSessions from "./pages/volunteer/dashboards/session/my-sessions";
import VolunteerHistory from "./pages/volunteer/dashboards/support-history/my-support-history";
import VolunteerNotifications from "./pages/volunteer/notifications/notifications";
import VolunteerSettings from "./pages/volunteer/settings/volunteer-settings";


function App() {
  const location = useLocation();
  const legacyNotificationDashboardPath =
    (location.state as { dashboardPath?: unknown } | null)?.dashboardPath;

  return (
    <div className="page-background bg-default">
      <div key={location.pathname} className="page-transition">
        <Routes location={location}>
          {/* Public routes */}
          <Route path="/" element={<IndexPage />} />

          {/* Notifications */}
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

          {/* Registration routes */}
          <Route path="/user-registration" element={<UserRegisterPage />} />
          <Route path="/volunteer-registration" element={<VolunteerRegisterPage flow="signup" />} />
          <Route path="/email-validation" element={<EmailValidationPage />} />
          <Route path="/set-password" element={<SetPasswordPage />} />
          <Route path="/account-created" element={<AccountCreatedPage />} />
          <Route path="/volunteer-registered" element={<VolunteerRegisteredPage />} />

          {/* Login routes */}
          <Route path="/login" element={<UserLoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/email-verification" element={<EmailVerificationPage />} />

          {/* - - - STUDENT ROUTES - - - */}
          {/* Dashboard Forms */}
          <Route path="/student/dashboard" element={<Require2FA><MyDashboard /></Require2FA>} />
          <Route path="/student/my-requests" element={<MyRequests />} />
          <Route path="/student/my-sessions" element={<MySessions />} />
          <Route path="/student/my-support-history" element={<MySupportHistory />} />
          <Route path="/student/notifications" element={<StudentNotifications />} />

          {/* Student Forms */}
          <Route path="/student/request-form" element={<MultiStepRequestForm />} />
          <Route path="/student/session-form" element={<MultiStepSessionForm />} />
          <Route path="/student/feedback-form/:sessID" element={<FeedbackForm />} />
          <Route path="/student/session-edit/:sessID" element={<SessionRearrangement />} />
          <Route path="/student/settings" element={<StudentSettings />} />

          {/* - - - VOLUNTEER ROUTES - - - */}
          <Route path="/volunteer/dashboard" element={<VolunteerDashboard />} />
          <Route path="/volunteer/my-requests" element={<VolunteerRequests />} />
          <Route path="/volunteer/my-sessions" element={<VolunteerSessions />} />
          <Route path="/volunteer/my-support-history" element={<VolunteerHistory />} />
          <Route path="/volunteer/notifications" element={<VolunteerNotifications />} />
          <Route path="/become-volunteer" element={<VolunteerRegisterPage flow="upgrade" />}/>

          {/* Volunteer Forms */}
          <Route path="/volunteer/session-form" element={<MultiStepSessionForm />} />
          <Route path="/volunteer/session-edit/:sessID" element={<SessionRearrangement />} />
          <Route path="/volunteer/settings" element={<VolunteerSettings />} />
        </Routes>
      </div>
    </div>
  );
}

export default App
