import type { ReactElement } from "react";

import Require2FA from "./components/require-2fa";

// PUBLIC PAGES-----------------------------------------------------------------------------
import IndexPage from './pages/index/index'

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

// STUDENT PAGES -----------------------------------------------------------------------------
import MyDashboard from "./pages/student/dashboards/dashboard";
import MyRequests from "./pages/student/dashboards/requests/my-requests";
import StudentSessions from './pages/student/dashboards/sessions/my-sessions';
import MySupportHistory from './pages/student/dashboards/support-history/my-support-history';
import MultiStepRequestForm from './pages/student/request/request-form';
import StudentMultiStepSessionForm from './pages/student/session/session-form';
import StudentSessionRearrangement from './pages/student/session/session-rearrangement';
import FeedbackForm from './pages/student/feedback/feedback-form';
import StudentNotifications from './pages/student/notifications/notifications';
import StudentSettings from './pages/student/settings/student-settings';

// VOLUNTEER PAGES -----------------------------------------------------------------------------
import VolunteerDashboard from "./pages/volunteer/dashboards/dashboard";
import VolunteerRequests from "./pages/volunteer/dashboards/request/my-requests";
import VolunteerSessions from "./pages/volunteer/dashboards/session/my-sessions";
import VolunteerHistory from "./pages/volunteer/dashboards/support-history/my-support-history";
import VolunteerMultiStepSessionForm from './pages/volunteer/session/session-form';
import VolunteerSessionRearrangement from './pages/volunteer/session/session-rearrangement';
import VolunteerNotifications from "./pages/volunteer/notifications/notifications";
import VolunteerSettings from "./pages/volunteer/settings/volunteer-settings";

export interface RouteDefinition {
  path: string;
  title: string;
  element: ReactElement;
}

export const routes: RouteDefinition[] = [
  // Public routes
  { path: "/", title: "Home", element: <IndexPage /> },

  // Registration routes
  { path: "/user-registration", title: "User Registration", element: <UserRegisterPage /> },
  { path: "/volunteer-registration", title: "Volunteer Registration", element: <VolunteerRegisterPage flow="signup" /> },
  { path: "/email-validation", title: "Email Validation", element: <EmailValidationPage /> },
  { path: "/set-password", title: "Set Password", element: <SetPasswordPage /> },
  { path: "/account-created", title: "Account Created", element: <AccountCreatedPage /> },
  { path: "/volunteer-registered", title: "Volunteer Registered", element: <VolunteerRegisteredPage /> },

  // Login routes
  { path: "/login", title: "Log In", element: <UserLoginPage /> },
  { path: "/forgot-password", title: "Forgot Password", element: <ForgotPasswordPage /> },
  { path: "/email-verification", title: "Email Verification", element: <EmailVerificationPage /> },

  // - - - STUDENT ROUTES - - -
  // Dashboard pages
  { path: "/student/dashboard", title: "Student Dashboard", element: <Require2FA><MyDashboard /></Require2FA> },
  { path: "/student/my-requests", title: "My Requests", element: <Require2FA><MyRequests /></Require2FA> },
  { path: "/student/my-sessions", title: "My Sessions", element: <Require2FA><StudentSessions /></Require2FA> },
  { path: "/student/my-support-history", title: "Support History", element: <Require2FA><MySupportHistory /></Require2FA> },
  { path: "/student/notifications", title: "Notifications", element: <Require2FA><StudentNotifications /></Require2FA> },

  // Student forms
  { path: "/student/request-form", title: "Request Support", element: <MultiStepRequestForm /> },
  { path: "/student/session-form", title: "Schedule a Session", element: <StudentMultiStepSessionForm /> },
  { path: "/student/feedback-form/:sessID", title: "Feedback", element: <FeedbackForm /> },
  { path: "/student/session-edit/:sessID", title: "Edit Session", element: <StudentSessionRearrangement /> },
  { path: "/student/settings", title: "Settings", element: <StudentSettings /> },

  // - - - VOLUNTEER ROUTES - - -
  { path: "/volunteer/dashboard", title: "Volunteer Dashboard", element: <VolunteerDashboard /> },
  { path: "/volunteer/my-requests", title: "My Requests", element: <VolunteerRequests /> },
  { path: "/volunteer/my-sessions", title: "My Sessions", element: <VolunteerSessions /> },
  { path: "/volunteer/my-support-history", title: "Support History", element: <VolunteerHistory /> },
  { path: "/volunteer/notifications", title: "Notifications", element: <VolunteerNotifications /> },
  { path: "/become-volunteer", title: "Become a Volunteer", element: <VolunteerRegisterPage flow="upgrade" /> },

  // Volunteer forms
  { path: "/volunteer/session-form", title: "Schedule a Session", element: <VolunteerMultiStepSessionForm /> },
  { path: "/volunteer/session-edit/:sessID", title: "Edit Session", element: <VolunteerSessionRearrangement /> },
  { path: "/volunteer/settings", title: "Settings", element: <VolunteerSettings /> },
];