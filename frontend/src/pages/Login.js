// src/pages/Login.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../api/config';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset any previous errors
    setError('');
    
    // Validate fields
    if (!username.trim() || !password.trim()) {
      setError('Username and password are required');
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }
      
      const data = await response.json();

      if (!data.successful) {
        throw new Error('Invalid username or password');
      }
      
      // Store the token in localStorage
      localStorage.setItem('token', data.access_token);
      
      // Store user information in localStorage
      const userData = {
        id: data.user_id || _extractUserIdFromToken(data.access_token),
        username: username
      };
      
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Trigger a custom event to notify other components of login
      window.dispatchEvent(new Event('login'));
      
      // Redirect to home page after successful login
      navigate('/');
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to login. Please try again.');
    }
  };

  // Helper function to extract user ID from JWT token
  const _extractUserIdFromToken = (token) => {
    try {
      // JWT tokens are in the format: header.payload.signature
      // We need to decode the payload (the middle part)
      const payload = token.split('.')[1];
      
      // The payload is base64 encoded, so we need to decode it
      const decodedPayload = atob(payload);
      
      // Parse the decoded payload as JSON
      const payloadData = JSON.parse(decodedPayload);
      
      // The user ID should be in the 'sub' or 'identity' field
      return payloadData.sub || payloadData.identity;
    } catch (error) {
      console.error('Error extracting user ID from token:', error);
      return null;
    }
  };

  return (
    <div className="login-container">
      <h2>Login to Course Explorer</h2>
      
      {error && <div className="form-error">{error}</div>}
      
      <form onSubmit={handleSubmit} className="login-form">
        <div className="form-group">
          <label htmlFor="username">Username:</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
          />
        </div>
        
        <button type="submit">Login</button>
      </form>
      
      <div className="register-link">
        <p>Don't have an account? 
          <button 
            type="button" 
            className="register-button" 
            onClick={() => navigate('/register')}
          >
            Create Account
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;