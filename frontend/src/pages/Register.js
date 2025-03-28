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
      const response = await fetch(`${API_BASE_URL}/users/insert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }
      
      const data = await response.json();
      
      // Store the token in localStorage
      localStorage.setItem('token', data.access_token);
      
      // Trigger a custom event to notify other components of login
      window.dispatchEvent(new Event('login'));
      
      setSuccess(true);
      
      // Redirect to home page after successful registration
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Failed to register. Please try again.');
    }
  };

  return (
    <div className="register-container">
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