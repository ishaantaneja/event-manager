import React from "react";
import { BrowserRouter as Router, Routes, Route, useParams } from "react-router-dom";
import LoginPage from "./pages/LoginPage.js";
import RegisterPage from "./pages/RegisterPage.js";
import EventListPage from "./pages/EventListPage.js";
import EventDetailPage from "./pages/EventDetailsPage.js";
import DashboardPage from "./pages/DashboardPage.js";

// Wrapper to pass eventId from URL params
function EventDetailPageWrapper() {
  const { id } = useParams();
  return <EventDetailPage eventId={id} />;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/" element={<EventListPage />} />
        <Route path="/event/:id" element={<EventDetailPageWrapper />} /> {/* Using wrapper */}
        <Route path="/dashboard" element={<DashboardPage />} />
      </Routes>
    </Router>
  );
}

export default App;
