// src/routes.js
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import UserTest from './pages/UserTest';
import RateCourse from './pages/RateCourse';
import CourseSelectionForRating from './pages/CourseSelectionForRating';
import CourseDetail from './pages/CourseDetail';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/users" element={<UserTest />} />
      <Route path="/user/:userId/rate-course-select" element={<CourseSelectionForRating />} />
      <Route path="/user/:userId/rate-course/:courseId" element={<RateCourse />} />
      <Route path="/course/:courseId" element={<CourseDetail />} />
    </Routes>
  );
};

export default AppRoutes;