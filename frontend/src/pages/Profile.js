// src/pages/Profile.js
import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';

const Profile = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      setIsAuthenticated(false);
      setLoading(false);
      return;
    }
    
    // This is just a placeholder for now - in a real app you'd fetch user data
    setUserData({
      username: 'demouser',
      email: 'demo@example.com',
      joinedDate: new Date().toLocaleDateString()
    });
    setLoading(false);
  }, []);

  if (loading) {
    return <div className="loading">Loading profile data...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="profile-container">
      <h1>User Profile</h1>
      <p>This page is under construction. More features coming soon!</p>
      
      {userData && (
        <div className="profile-info">
          <div className="profile-field">
            <label>Username:</label>
            <span>{userData.username}</span>
          </div>
          
          <div className="profile-field">
            <label>Email:</label>
            <span>{userData.email}</span>
          </div>
          
          <div className="profile-field">
            <label>Joined:</label>
            <span>{userData.joinedDate}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;