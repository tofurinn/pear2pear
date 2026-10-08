import { Routes, Route, useLocation } from "react-router-dom";
import './App.css';

import app from "./firebase/config";
console.log("YOUR FIREBASE IS GG FURKIN WORKINNNNN... PROJECT ID IS:", app.options.projectId);

// PUBLIC PAGES-----------------------------------------------------------------------------
import IndexPage from './pages/index/index'
import NotificationsPage from './pages/notifications/notifications'

// REGISTRATION PAGES-----------------------------------------------------------------------------
import UserRegisterPage from "./pages/registration/user-register/user-register";
import VolunteerRegisterPage from "./pages/registration/volunteer-register/volunteer-register";
import EmailValidationPage from "./pages/registration/email-validation/email-validation";
import SetPasswordPage from "./pages/registration/set-password/set-password";

// LOGIN PAGES-----------------------------------------------------------------------------
import UserLoginPage from "./pages/login/login";
import ForgotPasswordPage from "./pages/login/forgot-password/input-email";
import EmailVerificationPage from "./pages/login/2FA/2fa";
import VerifyCodePage from "./pages/login/forgot-password/verify-code";
import ResetPasswordPage from "./pages/login/forgot-password/reset-password";

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

          {/* Registration routes */}
          <Route path="/user-registration" element={<UserRegisterPage />} />
          <Route path="/volunteer-registration" element={<VolunteerRegisterPage />} />
          <Route path="/email-validation" element={<EmailValidationPage />} />
          <Route path="/set-password" element={<SetPasswordPage />} />

          {/* Login routes */}
          <Route path="/login" element={<UserLoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/email-verification" element={<EmailVerificationPage />} />
          <Route path="/verify-code" element={<VerifyCodePage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />


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
          <Route path="/student/session-edit/:sessID" element={<SessionRearrangement />} />

          {/* - - - VOLUNTEER ROUTES - - - */}
          <Route path="/volunteer/dashboard" element={<VolunteerDashboard />} />
          <Route path="/volunteer/my-requests" element={<VolunteerRequests />} />
          <Route path="/volunteer/my-sessions" element={<VolunteerSessions />} />
          <Route path="/volunteer/my-support-history" element={<VolunteerHistory />} />

          {/* Volunteer Forms */}
          <Route path="/volunteer/session-form" element={<MultiStepSessionForm />} />
          <Route path="/volunteer/session-edit/:sessID" element={<SessionRearrangement />} />
        </Routes>
      </div>
    </div>
  );
}

export default App
