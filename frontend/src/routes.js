// src/routes.js
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Profile from './pages/Profile';
import CourseDetail from './pages/CourseDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import Discussions from './pages/Discussions';
import DiscussionDetail from './pages/DiscussionDetail';

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
      <Route path="/profile" element={<ProtectedRoute element={<Profile />} />} />
      <Route path="/course/:courseId" element={<CourseDetail />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/discussions" element={<Discussions />} />
      <Route path="/discussion/:discussionId" element={<DiscussionDetail />} />
    </Routes>
  );
};

export default AppRoutes;