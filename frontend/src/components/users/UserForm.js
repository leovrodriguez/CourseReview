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
  const validateUsername = () => {
    if (username.length < 3) {
      setUsernameError("Username must be at least 3 characters.");
      return false;
    }
  };

  // async function to validate email
  const validateEmail = () => {
    const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/g;
    if (!emailRegex.test(email)) {
      setEmailError("Invalid email format (e.g., johndoe@example.com).");
      return false;
    }
    return true
  };

  const validatePassword = () => {
    const specialCharacterRegex = /[!@#$%^&*(),.?":{}|<>]/;
    const uppercaseRegex = /[A-Z]/;
    const numberRegex = /[0-9]/;
  
    if (!password.trim()) {
      return { isValid: false, message: 'Password cannot be blank' };
    }
  
    const issues = [];
  
    if (password.length < 8) {
      issues.push('at least 8 characters');
    }
    if (!specialCharacterRegex.test(password)) {
      issues.push('include at least one special character');
    }
    if (!uppercaseRegex.test(password)) {
      issues.push('include at least one uppercase letter');
    }
    if (!numberRegex.test(password)) {
      issues.push('include at least one number');
    }
  
    if (issues.length > 0) {
      const message = 'Password must be ' + issues.join(', ') + '.';
      setPasswordError(message);
      return false;
    }
    return true;
  }
 
  const validateConfirmPassword = () => {
    if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match");
      return false;
    }
    setConfirmPasswordError("");
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
      const isUsernameValid = validateUsername();
      const isEmailValid = validateEmail();
      const isPasswordValid = validatePassword();
      const isConfirmPasswordValid = validateConfirmPassword();

      // Check if all validations passed
      if (!isUsernameValid || !isEmailValid || !isPasswordValid || !isConfirmPasswordValid) {
        setIsSubmitting(false);
        return;
      }

      // All validations passed, call the onSubmit function
      
      const result = await onSubmit({ username, email, password });

      if (!result.success) {
        console.log("Form validation failed due to validation errors");
        setError(result.message || "Failed to create account.");
        if (result.usernameError) {
          setUsernameError(result.usernameError);
        }
        if (result.emailError) {
          setEmailError(result.emailError);
        }
        if (result.passwordError) {
          setPasswordError(result.passwordError);
        }
        setIsSubmitting(false); // Show form again
        return;
      }
      console.log("Form validation passed - submitting user data");
      setIsSubmitting(true)
    } catch (err) {
      console.error("Error during form submission:", err);
      setError("An error occurred while creating your account. Please try again.");
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