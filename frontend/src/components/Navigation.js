import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import { useSocket } from '../contexts/SocketContext';

const Navigation = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { userInfo } = useSelector((state) => state.auth);
  const { unreadMessages, unreadNotifications } = useSocket();
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  return (
    <nav className="relative bg-gradient-to-r from-gray-900 via-purple-900/50 to-gray-900 border-b border-purple-500/30">
      {/* Animated background effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-pink-600/10 to-cyan-600/10 animate-pulse"></div>
      
      <div className="relative container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="relative">
              <span className="text-3xl animate-pulse">⚡</span>
              <div className="absolute inset-0 blur-xl bg-purple-500/50 group-hover:bg-pink-500/50 transition-colors"></div>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
              EVENTHUB
            </span>
            <span className="text-xs text-purple-400 animate-pulse">2025</span>
          </Link>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6">
            <Link 
              to="/" 
              className="relative text-purple-300 hover:text-cyan-400 transition-colors group"
            >
              <span>Events</span>
              <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 scale-x-0 group-hover:scale-x-100 transition-transform"></div>
            </Link>
            <Link 
              to="/external-events" 
              className="relative text-purple-300 hover:text-cyan-400 transition-colors group"
            >
              <span>🌍 Global</span>
              <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 scale-x-0 group-hover:scale-x-100 transition-transform"></div>
            </Link>
            
            {userInfo ? (
              <>
                <Link 
                  to="/dashboard" 
                  className="relative text-purple-300 hover:text-cyan-400 transition-colors group"
                >
                  <span>Dashboard</span>
                  {(unreadMessages > 0 || unreadNotifications > 0) && (
                    <span className="absolute -top-2 -right-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse shadow-lg shadow-pink-500/50">
                      {unreadMessages + unreadNotifications}
                    </span>
                  )}
                  <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 scale-x-0 group-hover:scale-x-100 transition-transform"></div>
                </Link>
                {userInfo.role === 'admin' && (
                  <Link 
                    to="/admin" 
                    className="relative text-purple-300 hover:text-cyan-400 transition-colors group"
                  >
                    <span>⚙️ Admin</span>
                    <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-red-500 to-orange-500 scale-x-0 group-hover:scale-x-100 transition-transform"></div>
                  </Link>
                )}
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2 px-3 py-1 bg-gray-800/50 rounded-lg border border-purple-500/30">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center font-bold shadow-lg shadow-purple-500/50">
                      {userInfo.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm text-purple-300">{userInfo.name}</span>
                  </div>
                  <button 
                    onClick={handleLogout} 
                    className="px-4 py-2 bg-gradient-to-r from-red-600 to-pink-600 rounded-lg hover:from-red-700 hover:to-pink-700 text-white font-semibold transition-all shadow-lg shadow-red-500/30"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link 
                  to="/login" 
                  className="px-4 py-2 text-purple-300 hover:text-cyan-400 transition-colors"
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg hover:from-purple-700 hover:to-pink-700 text-white font-semibold transition-all shadow-lg shadow-purple-500/30"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="md:hidden text-purple-400 hover:text-cyan-400 focus:outline-none"
          >
            <svg className="h-6 w-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
              {showMobileMenu ? (
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="md:hidden py-4 border-t border-purple-500/30 bg-gray-900/95 backdrop-blur-sm">
            <Link 
              to="/" 
              className="block py-2 text-purple-300 hover:text-cyan-400"
              onClick={() => setShowMobileMenu(false)}
            >
              Events
            </Link>
            <Link 
              to="/external-events" 
              className="block py-2 text-purple-300 hover:text-cyan-400"
              onClick={() => setShowMobileMenu(false)}
            >
              🌍 Global Events
            </Link>
            
            {userInfo ? (
              <>
                <Link 
                  to="/dashboard" 
                  className="block py-2 text-purple-300 hover:text-cyan-400"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Dashboard
                  {(unreadMessages > 0 || unreadNotifications > 0) && (
                    <span className="ml-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white text-xs px-2 py-1 rounded-full">
                      {unreadMessages + unreadNotifications} new
                    </span>
                  )}
                </Link>
                {userInfo.role === 'admin' && (
                  <Link 
                    to="/admin" 
                    className="block py-2 text-purple-300 hover:text-cyan-400"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    ⚙️ Admin
                  </Link>
                )}
                <div className="pt-4 mt-4 border-t border-purple-500/30">
                  <p className="text-sm text-purple-400 mb-2">Logged in as {userInfo.name}</p>
                  <button 
                    onClick={handleLogout} 
                    className="w-full py-2 bg-gradient-to-r from-red-600 to-pink-600 rounded-lg text-white font-semibold"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <div className="pt-4 mt-4 border-t border-purple-500/30 space-y-2">
                <Link 
                  to="/login" 
                  className="block py-2 text-center text-purple-300 hover:text-cyan-400"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="block py-2 text-center bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg text-white font-semibold"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
