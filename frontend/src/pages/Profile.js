// src/pages/Profile.js
import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { API_BASE_URL } from '../api/config';

const Profile = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Check if token exists
        const token = localStorage.getItem('token');
        if (!token) {
          setIsAuthenticated(false);
          setLoading(false);
          return;
        }

        // Get user ID from localStorage
        const userString = localStorage.getItem('user');
        if (!userString) {
          setError('User information not found');
          setLoading(false);
          return;
        }

        // Parse user data from localStorage
        const userInfo = JSON.parse(userString);
        const userId = userInfo.id;

        if (!userId) {
          setError('User ID not found');
          setLoading(false);
          return;
        }

        console.log('Fetching user data for ID:', userId);

        // Fetch user data from API
        const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch user data');
        }

        const userData = await response.json();
        console.log('User data received:', userData);

        // Format the date
        const joinedDate = new Date(userData.created_at).toLocaleDateString();

        setUserData({
          ...userData,
          joinedDate
        });
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError(err.message || 'Failed to fetch user data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
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
      
      {error && (
        <div className="error-message">{error}</div>
      )}

      {!error && !userData && (
        <div className="error-message">Unable to load user profile</div>
      )}

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