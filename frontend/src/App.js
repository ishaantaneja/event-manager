import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Provider } from "react-redux";
import { Toaster } from 'react-hot-toast';
import { store } from "./store/store";
import { SocketProvider } from "./contexts/SocketContext";
import Navigation from "./components/Navigation";
import ProtectedRoute from "./components/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import { startHealthMonitoring, stopHealthMonitoring } from "./services/api";

// Pages
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import EventListPage from "./pages/EventListPage";
import EventDetailsPage from "./pages/EventDetailsPage";
import DashboardPage from "./pages/DashboardPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import ExternalEventsPage from "./pages/ExternalEventsPage";

function App() {
  useEffect(() => {
    // Start health monitoring
    startHealthMonitoring();
    
    // Cleanup on unmount
    return () => {
      stopHealthMonitoring();
    };
  }, []);

  return (
    <Provider store={store}>
      <ErrorBoundary>
        <SocketProvider>
          <Router>
          <div className="min-h-screen bg-black relative overflow-hidden">
            {/* Animated cyberpunk background */}
            <div className="fixed inset-0 z-0">
              <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-purple-900/20 to-black"></div>
              <div className="absolute top-0 left-0 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
              <div className="absolute bottom-0 right-0 w-96 h-96 bg-pink-600/20 rounded-full blur-3xl animate-pulse delay-700"></div>
              <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
              
              {/* Grid overlay using CSS instead of SVG */}
              <div 
                className="absolute inset-0 opacity-30"
                style={{
                  backgroundImage: `
                    linear-gradient(rgba(147, 51, 234, 0.1) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(147, 51, 234, 0.1) 1px, transparent 1px)
                  `,
                  backgroundSize: '60px 60px'
                }}
              ></div>
            </div>
            
            {/* Main content */}
            <div className="relative z-10">
              <Navigation />
              <div className="container mx-auto px-4 py-8">
                <Routes>
                  <Route path="/" element={<EventListPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/event/:id" element={<EventDetailsPage />} />
                  <Route path="/external-events" element={<ExternalEventsPage />} />
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <DashboardPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute adminOnly>
                        <AdminDashboardPage />
                      </ProtectedRoute>
                    }
                  />
                </Routes>
              </div>
            </div>
            
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: '#fff',
                  border: '1px solid rgba(147, 51, 234, 0.3)',
                  boxShadow: '0 10px 40px rgba(147, 51, 234, 0.3)',
                },
                success: {
                  style: {
                    background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
                  },
                  iconTheme: {
                    primary: '#fff',
                    secondary: '#10b981',
                  },
                },
                error: {
                  style: {
                    background: 'linear-gradient(135deg, #ef4444 0%, #ec4899 100%)',
                  },
                  iconTheme: {
                    primary: '#fff',
                    secondary: '#ef4444',
                  },
                },
              }}
            />
          </div>
          </Router>
        </SocketProvider>
      </ErrorBoundary>
    </Provider>
  );
}

export default App;
