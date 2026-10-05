import { Routes, Route } from "react-router-dom";
import './App.css';

import app from "./firebase/config";
console.log("YOUR FIREBASE IS GG FURKIN WORKINNNNN... PROJECT ID IS:", app.options.projectId);

import IndexPage from './pages/index/index'

// Student pages
import MultiStepSessionForm from './pages/student/session/session-form';
import FeedbackForm from './pages/student/feedback/feedback-form';
import MySessions from './pages/student/dashboards/my-sessions';
import MySupportHistory from './pages/student/dashboards/my-support-history';
import MyRequests from "./pages/student/dashboards/my-requests";

function App() {
  return (
    <div className="page-background bg-default">
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<IndexPage />} />

        {/* Student routes */}
        <Route path="/student/my-requests" element={<MyRequests />} />
        <Route path="/student/my-sessions" element={<MySessions />} />
        <Route path="/student/my-support-history" element={<MySupportHistory />} />
        <Route path="/student/session-form" element={<MultiStepSessionForm/>} />
        <Route path="/student/feedback-form" element={<FeedbackForm/>} />

        {/* Volunteer routes */}
        
      </Routes>
    </div>
  );
}

export default App
