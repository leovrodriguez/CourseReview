import React, { useState } from 'react';
import { API_BASE_URL } from '../../api/config';

const UserForm = ({ onSubmit }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isTokenValid, setIsTokenValid] = useState(null);  // Track token validity state
  const [loading, setLoading] = useState(true);  // Loading state during validation

  // async function to validate username
  const validateUsername = async () => {
    if (username.length < 3) {
      setUsernameError("Username must be at least 3 characters.");
      return false;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/users/checkUsername`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
      });
      if (!response.ok) {
        throw new Error("Error checking username");
      }
      const data = await response.json();
      if (!data.isAvailable) {
        // set the error to be displayed
        setUsernameError(data.message);
        return false;
      } else {
        setUsernameError("");
        return true;
      }
    } catch (error) {
      console.error("Error checking username:", error);
      setUsernameError("Error checking username availability");
      return false;
    }
  };

  // async function to validate email
  const validateEmail = async () => {
    const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/g;
    if (!emailRegex.test(email)) {
      setEmailError("Invalid email format (e.g., johndoe@example.com).");
      return false;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/users/checkEmail`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) {
        throw new Error("Error checking email");
      }
      const data = await response.json();
      if (!data.isAvailable) {
        setEmailError(data.message);
        return false;
      } else {
        setEmailError("");
        return true;
      }
    } catch (error) {
      console.error("Error checking email:", error);
      setEmailError("Error checking email availability");
      return false;
    }
  };

  const validatePassword = async () => {
    const specialCharacterRegex = /[!@#$%^&*(),.?":{}|<>]/;
    const uppercaseRegex = /[A-Z]/;
    const numberRegex = /[0-9]/;

    if (!password.trim()) {
      setPasswordError('Password cannot be blank');
      return false;
    }

    if (
      password.length < 8 ||
      !specialCharacterRegex.test(password) ||
      !numberRegex.test(password)
    ) {
      setPasswordError("Password must be at least 8 characters, at least one special character, at least one uppercase letter, and at least one number.");
      return false;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/users/checkPassword`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });
      if (!response.ok) {
        throw new Error("Error checking password");
      }
      const data = await response.json();
      if (!data.isAvailable) {
        setPasswordError(data.message);
        return false;
      }
    } catch (error) {
      console.error("Error checking password:", error);
      setPasswordError("Error checking password with the backend");
      return false;
    }
    setPasswordError("");
    return true;
  };
 
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Reset any previous errors
    setError('');
    setUsernameError('');
    setEmailError('');
    setPasswordError('');

    // Validate fields
    if (!username.trim() || !email.trim()) {
      setError('Username and email are required');
      return;
    }

    const isUsernameValid = await validateUsername();
    const isEmailValid = await validateEmail();
    const isPasswordValid = validatePassword();

    if (!isUsernameValid || !isEmailValid || !isPasswordValid) {
      return;
    }

    onSubmit({ username, email, password });
  };

  return (
    <form onSubmit={handleSubmit} className="user-form">
      <h2>Add New User</h2>

      {error && <div className="form-error">{error}</div>}

      <div className="form-group">
        <label htmlFor="username">Username:</label>
        <input
          type="text"
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter username"
          className={usernameError ? "error-input" : ""}
        />
        {usernameError && <div className="error">{usernameError}</div>}
      </div>

      <div className="form-group">
        <label htmlFor="email">Email:</label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter email"
          className={emailError ? "error-input" : ""}
        />
        {emailError && <div className="error">{emailError}</div>}
      </div>

      <div className="form-group">
        <label htmlFor="password">Password:</label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter password"
          className={passwordError ? "error-input" : ""}
        />
        {passwordError && <div className="error">{passwordError}</div>}
      </div>

      <button type="submit">Add User</button>
    </form>
  );
};

export default UserForm;