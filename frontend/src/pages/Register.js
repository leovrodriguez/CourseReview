// src/pages/Register.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../api/config';
import UserForm from '../components/users/UserForm';

const Register = () => {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (userData) => {
    try {
      console.log("Submitting user data:", userData);
      
      const response = await fetch(`${API_BASE_URL}/users/insert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || data.error || 'Registration failed');
      }
      if (!data.success) {
        return data;
      }
      
      console.log("Registration successful:", data);
      
      // Store the token in localStorage
      localStorage.setItem('token', data.access_token);
      
      // Store user information in localStorage
      const userInfo = {
        id: data.user_id,
        username: userData.username
      };
      
      localStorage.setItem('user', JSON.stringify(userInfo));
      
      // Trigger a custom event to notify other components of login
      window.dispatchEvent(new Event('login'));
      
      setSuccess(true);
      
      // Redirect to home page after successful registration
      setTimeout(() => {
        navigate('/');
      }, 2000);
      return {
        success: true
      };
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Failed to register. Please try again.');
    }
  };

  return (
    <div className="login-container">
      <h2>Create an Account</h2>
      
      {error && <div className="form-error">{error}</div>}
      {success && (
        <div className="form-success">
          Registration successful! You'll be redirected to the home page...
        </div>
      )}
      
      {!success && (
        <>
          <UserForm onSubmit={handleSubmit} />
          
          <div className="login-link">
            <p>Already have an account?
              <button
                type="button"
                className="login-button"
                onClick={() => navigate('/login')}
              >
                Login
              </button>
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default Register;