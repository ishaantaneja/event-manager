import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/slices/authSlice';

const Navigation = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { userInfo } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  return (
    <nav className="bg-blue-600 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold">
          EventManager
        </Link>
        
        <div className="flex space-x-4 items-center">
          <Link to="/" className="hover:text-blue-200">Events</Link>
          
          {userInfo ? (
            <>
              <Link to="/dashboard" className="hover:text-blue-200">
                Dashboard
              </Link>
              {userInfo.role === 'admin' && (
                <Link to="/admin" className="hover:text-blue-200">
                  Admin
                </Link>
              )}
              <span>Welcome, {userInfo.name}</span>
              <button onClick={handleLogout} className="hover:text-blue-200">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-blue-200">Login</Link>
              <Link to="/register" className="hover:text-blue-200">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
