import React, { useState } from 'react';
import { API_BASE_URL } from '../../api/config';

const UserForm = ({ onSubmit }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      
      // Only set error message if username is not available
      if (!data.isAvailable) {
        setUsernameError(data.message);
      } else {
        setUsernameError(''); // Clear error if username is available
      }
      
      return data.isAvailable;
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
      
      // Only set error message if email is not available
      if (!data.isAvailable) {
        setEmailError(data.message);
      } else {
        setEmailError(''); // Clear error if email is available
      }
      
      return data.isAvailable;
      
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
      !numberRegex.test(password) ||
      !uppercaseRegex.test(password)
    ) {
      setPasswordError("Password must be at least 8 characters, at least one special character, at least one uppercase letter, and at least one number.");
      return false;
    }

    setPasswordError(""); // Clear error if password is valid
    return true;
  };

  const validateConfirmPassword = () => {
    if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match");
      return false;
    }
    setConfirmPasswordError(""); // Clear error if passwords match
    return true;
  };
 
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prevent multiple submission attempts
    if (isSubmitting) return;
    
    // Set submitting state
    setIsSubmitting(true);

    try {
      // Reset any previous errors
      setError('');
      setUsernameError('');
      setEmailError('');
      setPasswordError('');
      setConfirmPasswordError('');

      // Validate fields
      if (!username.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
        setError('All fields are required');
        setIsSubmitting(false);
        return;
      }

      // Run all validations
      const isUsernameValid = await validateUsername();
      const isEmailValid = await validateEmail();
      const isPasswordValid = await validatePassword();
      const isConfirmPasswordValid = validateConfirmPassword();

      // Check if all validations passed
      if (!isUsernameValid || !isEmailValid || !isPasswordValid || !isConfirmPasswordValid) {
        setIsSubmitting(false);
        return;
      }

      // All validations passed, call the onSubmit function
      console.log("Form validation passed - submitting user data");
      onSubmit({ username, email, password });
    } catch (err) {
      console.error("Error during form submission:", err);
      setError("An unexpected error occurred. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="login-form">
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
        {usernameError && <div className="form-error">{usernameError}</div>}
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
        {emailError && <div className="form-error">{emailError}</div>}
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
        {passwordError && <div className="form-error">{passwordError}</div>}
      </div>

      <div className="form-group">
        <label htmlFor="confirmPassword">Confirm Password:</label>
        <input
          type="password"
          id="confirmPassword"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm your password"
          className={confirmPasswordError ? "error-input" : ""}
        />
        {confirmPasswordError && <div className="form-error">{confirmPasswordError}</div>}
      </div>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creating Account...' : 'Create Account'}
      </button>
    </form>
  );
};

export default UserForm;