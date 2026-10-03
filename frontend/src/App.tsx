import { Routes, Route } from "react-router-dom";
import './App.css';

import app from "./firebase/config";
console.log("YOUR FIREBASE IS GG FURKIN WORKINNNNN... PROJECT ID IS:", app.options.projectId);

import IndexPage from './pages/index/index'
import SessionForm from './pages/student/session/session-form';

function App() {
  return (
    <div className="page-background bg-default">
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<IndexPage />} />

        {/* Student routes */}
        <Route path="/session-form" element={<SessionForm/>} />

        {/* Volunteer routes */}
        
      </Routes>
    </div>
  );
}

export default App
