// src/components/common/Navbar.js
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const Navbar = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const dropdownRef = useRef(null);
    
    // Effect to close dropdown when navigating
    useEffect(() => {
        // Close dropdown when route changes
        setDropdownOpen(false);
      }, [location.pathname]);
      
  // Function to check authentication status
  const checkAuthStatus = () => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
  };

  useEffect(() => {
    // Check auth status on component mount
    checkAuthStatus();
    
    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    
    // Listen for storage events to handle login/logout in other tabs
    const handleStorageChange = () => {
      checkAuthStatus();
    };
    
    // Listen for custom login/logout events
    const handleLogin = () => {
      setIsAuthenticated(true);
      // Ensure dropdown is closed on login
      setDropdownOpen(false);
    };
    
    const handleLogout = () => {
      setIsAuthenticated(false);
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('login', handleLogin);
    window.addEventListener('logout', handleLogout);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('login', handleLogin);
      window.removeEventListener('logout', handleLogout);
    };
  }, []); // Only run once on mount

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    
    // Dispatch logout event
    window.dispatchEvent(new Event('logout'));
    
    navigate('/login');
  };

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <a href="/">Course Explorer</a>
      </div>
      
      <ul className="navbar-links">
        <li><a href="/">Home</a></li>
        <li><a href="/discussions">Discussions</a></li>
      </ul>
      
      <div className="navbar-auth">
        {isAuthenticated ? (
          <>
            <div className="account-dropdown" ref={dropdownRef}>
              <button 
                className="account-button" 
                onClick={toggleDropdown}
              >
                Account
                <span className="dropdown-arrow">▼</span>
              </button>
              
              {dropdownOpen && (
                <div className="dropdown-menu">
                  <a href="/profile">Profile</a>
                  <button onClick={handleLogout}>Logout</button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="auth-buttons">
            <a href="/login" className="login-nav-button">Login</a>
            <a href="/register" className="register-nav-button">Register</a>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;