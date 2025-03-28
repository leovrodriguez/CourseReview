// src/routes.js
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Profile from './pages/Profile';
import UserTest from './pages/UserTest';
import RateCourse from './pages/RateCourse';
import CourseSelectionForRating from './pages/CourseSelectionForRating';
import CourseDetail from './pages/CourseDetail';
import Login from './pages/Login';
import Register from './pages/Register';

// Simple authentication check
const isAuthenticated = () => {
  return localStorage.getItem('token') !== null;
};

// Protected route component
const ProtectedRoute = ({ element }) => {
  return isAuthenticated() ? element : <Navigate to="/login" />;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />

      {/* Remove Later */}
      <Route path="/users" element={<UserTest />} />

      <Route path="/profile" element={<ProtectedRoute element={<Profile />} />} />
      <Route path="/user/:userId/rate-course-select" element={<CourseSelectionForRating />} />
      <Route path="/user/:userId/rate-course/:courseId" element={<RateCourse />} />
      <Route path="/course/:courseId" element={<CourseDetail />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
    </Routes>
  );
};

export default AppRoutes;